import { Alert, Button, Flex, Stack, Text, TextInput, Title } from '@mantine/core'
import { IconCircleCheck, IconInfoCircle, IconRefresh, IconRestore } from '@tabler/icons-react'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModelProviderEnum } from 'src/shared/types'
import { ModelList } from '@/components/ModelList'
import { ScalableIcon } from '@/components/ScalableIcon'
import {
  createWanjieSmsCooldownUntil,
  buildWanjieConfiguredSettings,
  getWanjieSmsCooldownSecondsLeft,
  getWanjieBuiltinConfig,
  loginWanjie,
  maskWanjieApiKey,
  sendWanjieSms,
  syncWanjieProviderConfig,
} from '@/packages/wanjie'
import { useProviderSettings } from '@/stores/settingsStore'
import { add as addToast } from '@/stores/toastActions'

export const Route = createFileRoute('/settings/provider/wanjie/')({
  component: RouteComponent,
})

function isLikelyChinaPhone(phone: string) {
  return /^1\d{10}$/.test(phone)
}

export function RouteComponent() {
  const { t } = useTranslation()
  const providerId = ModelProviderEnum.Wanjie
  const { providerSettings, setProviderSettings } = useProviderSettings(providerId)

  const [phone, setPhone] = useState(providerSettings?.wanjiePhone || '')
  const [smsCode, setSmsCode] = useState('')
  const [smsId, setSmsId] = useState(providerSettings?.wanjieSmsId || '')
  const [countdown, setCountdown] = useState(() =>
    getWanjieSmsCooldownSecondsLeft(providerSettings?.wanjieSmsCooldownUntil)
  )
  const [sendingCode, setSendingCode] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const builtinConfig = getWanjieBuiltinConfig()
  const workerHost = builtinConfig.workerBaseUrl.trim()
  const encryptionKey = builtinConfig.encryptionKey.trim()
  const modelApiHost = builtinConfig.modelApiHost.trim()
  const configuredApiKey = providerSettings?.apiKey || ''
  const displayModels = providerSettings?.models || []

  useEffect(() => {
    if (!modelApiHost || providerSettings?.apiHost === modelApiHost) {
      return
    }
    setProviderSettings({ apiHost: modelApiHost })
  }, [modelApiHost, providerSettings?.apiHost, setProviderSettings])

  useEffect(() => {
    if (countdown <= 0) {
      return
    }

    const timer = setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          clearInterval(timer)
          return 0
        }
        return value - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  useEffect(() => {
    setCountdown(getWanjieSmsCooldownSecondsLeft(providerSettings?.wanjieSmsCooldownUntil))
  }, [providerSettings?.wanjieSmsCooldownUntil])

  const onSendCode = async () => {
    if (sendingCode || countdown > 0) {
      return
    }
    const normalizedPhone = phone.trim()
    if (!isLikelyChinaPhone(normalizedPhone)) {
      const msg = t('Please enter a valid 11-digit mainland China phone number')
      setErrorMessage(msg)
      addToast(msg)
      return
    }
    if (!workerHost) {
      const msg = t('Wanjie worker host is not configured in code')
      setErrorMessage(msg)
      addToast(msg)
      return
    }
    if (!encryptionKey) {
      const msg = t('Wanjie encryption key is not configured in code')
      setErrorMessage(msg)
      addToast(msg)
      return
    }

    try {
      setErrorMessage('')
      setSendingCode(true)
      const response = await sendWanjieSms({
        workerBaseUrl: workerHost,
        encryptionKey,
        phone: normalizedPhone,
      })
      const cooldownUntil = createWanjieSmsCooldownUntil()
      setSmsId(response.smsId)
      setProviderSettings({
        apiHost: modelApiHost,
        wanjiePhone: normalizedPhone,
        wanjieSmsId: response.smsId,
        wanjieSmsCooldownUntil: cooldownUntil,
      })
      setCountdown(getWanjieSmsCooldownSecondsLeft(cooldownUntil))
      addToast(t('SMS code sent successfully'))
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : (t('Failed to send SMS code') as string) || ''
      setErrorMessage(message)
      addToast(message)
    } finally {
      setSendingCode(false)
    }
  }

  const persistWanjieConfig = (next: {
    accessToken: string
    models: typeof displayModels
    apiKey: string
    phone: string
    smsId: string
  }) => {
    setProviderSettings((prev) => ({
      ...prev,
      ...buildWanjieConfiguredSettings({
        phone: next.phone,
        smsId: next.smsId,
        accessToken: next.accessToken,
        apiKey: next.apiKey,
        models: next.models,
      }),
    }))
  }

  const onLoginAndConfigure = async () => {
    const normalizedPhone = phone.trim()
    if (!isLikelyChinaPhone(normalizedPhone)) {
      const msg = t('Please enter a valid 11-digit mainland China phone number')
      setErrorMessage(msg)
      addToast(msg)
      return
    }
    if (!smsCode.trim()) {
      const msg = t('Verification code is required')
      setErrorMessage(msg)
      addToast(msg)
      return
    }
    if (!smsId.trim()) {
      const msg = t('smsId is required, please resend SMS code')
      setErrorMessage(msg)
      addToast(msg)
      return
    }
    if (!workerHost) {
      const msg = t('Wanjie worker host is not configured in code')
      setErrorMessage(msg)
      addToast(msg)
      return
    }
    if (!encryptionKey) {
      const msg = t('Wanjie encryption key is not configured in code')
      setErrorMessage(msg)
      addToast(msg)
      return
    }

    try {
      setErrorMessage('')
      setLoggingIn(true)
      const loginResult = await loginWanjie({
        workerBaseUrl: workerHost,
        encryptionKey,
        phone: normalizedPhone,
        code: smsCode.trim(),
        smsId: smsId.trim(),
      })

      const synced = await syncWanjieProviderConfig({
        workerBaseUrl: workerHost,
        encryptionKey,
        accessToken: loginResult.accessToken,
      })

      if (!synced.apiKey) {
        throw new Error(t('Login succeeded but failed to fetch API key') as string)
      }

      persistWanjieConfig({
        accessToken: loginResult.accessToken,
        models: synced.models,
        apiKey: synced.apiKey,
        phone: normalizedPhone,
        smsId: smsId.trim(),
      })
      addToast(t('Wanjie account configured successfully'))
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : (t('Failed to login and configure Wanjie account') as string) || ''
      setErrorMessage(message)
      addToast(message)
    } finally {
      setLoggingIn(false)
    }
  }

  const onRefreshConfig = async () => {
    const accessToken = providerSettings?.wanjieAccountToken?.trim()
    if (!accessToken) {
      const msg = t('Please login first to refresh models and API key')
      setErrorMessage(msg)
      addToast(msg)
      return
    }
    if (!workerHost) {
      const msg = t('Wanjie worker host is not configured in code')
      setErrorMessage(msg)
      addToast(msg)
      return
    }
    if (!encryptionKey) {
      const msg = t('Wanjie encryption key is not configured in code')
      setErrorMessage(msg)
      addToast(msg)
      return
    }

    try {
      setErrorMessage('')
      setSyncing(true)
      const synced = await syncWanjieProviderConfig({
        workerBaseUrl: workerHost,
        encryptionKey,
        accessToken,
      })

      if (!synced.apiKey) {
        throw new Error(t('Failed to fetch API key from Wanjie') as string)
      }

      setProviderSettings({
        apiHost: modelApiHost,
        apiKey: synced.apiKey,
        models: synced.models,
      })
      addToast(t('Wanjie configuration refreshed'))
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : (t('Failed to refresh Wanjie configuration') as string) || ''
      setErrorMessage(message)
      addToast(message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Stack gap="xxl">
      <Flex align="center" justify="space-between">
        <Title order={3} c="chatbox-secondary">
          {t('Wanjie')}
        </Title>
        {configuredApiKey ? (
          <Flex align="center" gap="xs">
            <ScalableIcon icon={IconCircleCheck} size={16} color="var(--chatbox-success)" />
            <Text size="sm" c="chatbox-secondary">
              {t('Configured')}: {maskWanjieApiKey(configuredApiKey)}
            </Text>
          </Flex>
        ) : null}
      </Flex>

      <Alert
        variant="light"
        color="blue"
        icon={<ScalableIcon icon={IconInfoCircle} size={16} />}
        title={t('Wanjie Login Flow')}
      >
        <Text size="sm">
          {t('Use phone + SMS code to login, then Chatbox will automatically pull API Key and authorized model list.')}
        </Text>
      </Alert>

      {errorMessage ? (
        <Alert color="red" variant="light">
          {errorMessage}
        </Alert>
      ) : null}

      <Alert variant="light" color="gray" title={t('Built-in Wanjie Configuration')}>
        <Text size="sm">
          {t('Wanjie Worker API Host')}: {workerHost}
        </Text>
        <Text size="sm">
          {t('Model API Host')}: {modelApiHost}
        </Text>
      </Alert>

      <Flex gap="sm" align="flex-end">
        <Stack gap="xs" flex={1}>
          <Text span fw="600">
            {t('Phone Number')}
          </Text>
          <TextInput
            value={phone}
            placeholder="13800138000"
            onChange={(event) => setPhone(event.currentTarget.value)}
          />
        </Stack>
        <Button onClick={onSendCode} loading={sendingCode} disabled={sendingCode || countdown > 0}>
          {countdown > 0 ? `${countdown}s` : t('Send SMS Code')}
        </Button>
      </Flex>

      <Stack gap="xs">
        <Stack gap="xs" flex={1}>
          <Text span fw="600">
            {t('Verification Code')}
          </Text>
          <TextInput value={smsCode} placeholder="123456" onChange={(event) => setSmsCode(event.currentTarget.value)} />
        </Stack>
        <Text size="sm" c="dimmed">
          {smsId
            ? t('smsId has been captured automatically from the SMS request.')
            : t('Please click "Send SMS Code" first to obtain smsId automatically.')}
        </Text>
      </Stack>

      <Flex gap="sm">
        <Button onClick={onLoginAndConfigure} loading={loggingIn} disabled={!smsId.trim()}>
          {t('Login and Configure')}
        </Button>
        <Button variant="light" onClick={onRefreshConfig} loading={syncing}>
          {t('Refresh Configuration')}
        </Button>
      </Flex>

      <Stack gap="xxs">
        <Flex justify="space-between" align="center">
          <Text span fw="600">
            {t('Model')}
          </Text>
          <Flex gap="sm" align="center" justify="flex-end">
            <Button
              variant="light"
              color="chatbox-gray"
              c="chatbox-secondary"
              size="compact-xs"
              px="sm"
              onClick={() => setProviderSettings({ models: [] })}
              leftSection={<ScalableIcon icon={IconRestore} size={12} />}
            >
              {t('Reset')}
            </Button>
            <Button
              variant="light"
              color="chatbox-gray"
              c="chatbox-secondary"
              size="compact-xs"
              px="sm"
              onClick={onRefreshConfig}
              loading={syncing}
              leftSection={<ScalableIcon icon={IconRefresh} size={12} />}
            >
              {t('Fetch')}
            </Button>
          </Flex>
        </Flex>
        <ModelList
          models={displayModels}
          showActions={true}
          showSearch={false}
          onDeleteModel={(modelId) =>
            setProviderSettings({ models: displayModels.filter((m) => m.modelId !== modelId) })
          }
        />
      </Stack>
    </Stack>
  )
}
