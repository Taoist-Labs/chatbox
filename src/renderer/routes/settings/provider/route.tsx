import { Box, Flex } from '@mantine/core'
import { SystemProviders } from '@shared/defaults'
import { ModelProviderEnum, type ProviderInfo } from '@shared/types'
import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { useMemo } from 'react'
import { ProviderList } from '@/components/settings/provider/ProviderList'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import { useSettingsStore } from '@/stores/settingsStore'

export const Route = createFileRoute('/settings/provider')({
  component: RouteComponent,
})

export function RouteComponent() {
  const isSmallScreen = useIsSmallScreen()
  const routerState = useRouterState()
  const customProviders = useSettingsStore((state) => state.customProviders)
  const providersMap = useSettingsStore((state) => state.providers)

  const providers = useMemo<ProviderInfo[]>(
    () =>
      [
        ...SystemProviders().filter((p) => p.id === ModelProviderEnum.Wanjie),
        ...(customProviders || []),
      ].map((p) => ({
        ...p,
        ...(providersMap?.[p.id] || {}),
      })),
    [customProviders, providersMap]
  )

  return (
    <Flex h="100%" w="100%">
      {(!isSmallScreen || routerState.location.pathname === '/settings/provider') && (
        <ProviderList providers={providers} />
      )}
      {!(isSmallScreen && routerState.location.pathname === '/settings/provider') && (
        <Box flex="1 1 75%" p="md" className="overflow-auto">
          <Outlet />
        </Box>
      )}
    </Flex>
  )
}
