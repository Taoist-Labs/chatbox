import { Box, Flex } from '@mantine/core'
import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { useMemo } from 'react'
import { SystemProviders } from 'src/shared/defaults'
import type { ProviderInfo } from 'src/shared/types'
import { ProviderList } from '@/components/settings/provider/ProviderList'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import { useSettingsStore } from '@/stores/settingsStore'

export const Route = createFileRoute('/settings/provider')({
  component: RouteComponent,
})

export function RouteComponent() {
  const isSmallScreen = useIsSmallScreen()
  const routerState = useRouterState()
  const providersMap = useSettingsStore((state) => state.providers)

  const providers = useMemo<ProviderInfo[]>(
    () =>
      SystemProviders.map((p) => ({
        ...p,
        ...(providersMap?.[p.id] || {}),
      })),
    [providersMap]
  )

  return (
    <Flex h="100%" w="100%">
      {(!isSmallScreen || routerState.location.pathname === '/settings/provider') && (
        <ProviderList
          providers={providers}
          onAddProvider={() => {}}
          onImportProvider={() => {}}
          isImporting={false}
          showManageActions={false}
        />
      )}
      {!(isSmallScreen && routerState.location.pathname === '/settings/provider') && (
        <Box flex="1 1 75%" p="md" className="overflow-auto">
          <Outlet />
        </Box>
      )}
    </Flex>
  )
}
