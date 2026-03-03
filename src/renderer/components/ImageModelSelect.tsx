import { Combobox, type ComboboxProps, Divider, Text, useCombobox } from '@mantine/core'
import type { ModelProvider } from '@shared/types'
import { forwardRef, type PropsWithChildren, useMemo } from 'react'
import { useProviders } from '@/hooks/useProviders'
import { getAvailableImageModelsForProvider } from '@/packages/image-generation-models'

interface ImageModel {
  modelId: string
  displayName: string
}

export type ImageModelSelectProps = PropsWithChildren<
  {
    onSelect?: (provider: ModelProvider, model: string) => void
  } & ComboboxProps
>

export const ImageModelSelect = forwardRef<HTMLButtonElement, ImageModelSelectProps>(
  ({ onSelect, children, ...comboboxProps }, ref) => {
    const { providers } = useProviders()

    const providerGroups = useMemo(
      () =>
        providers
          .map((provider) => ({
            provider,
            imageModels: getAvailableImageModelsForProvider(
              provider.id,
              provider.models || provider.defaultSettings?.models || []
            ),
          }))
          .filter((item) => item.imageModels.length > 0),
      [providers]
    )

    const combobox = useCombobox({
      onDropdownClose: () => {
        combobox.resetSelectedOption()
        combobox.focusTarget()
      },
    })

    const handleOptionSubmit = (val: string) => {
      const [provider, modelId] = val.split(':')
      onSelect?.(provider as ModelProvider, modelId)
      combobox.closeDropdown()
    }

    return (
      <Combobox
        store={combobox}
        width={280}
        position="top"
        withinPortal={true}
        {...comboboxProps}
        onOptionSubmit={handleOptionSubmit}
      >
        <Combobox.Target targetType="button">
          <button ref={ref} onClick={() => combobox.toggleDropdown()} className="border-none bg-transparent p-0 flex">
            {children}
          </button>
        </Combobox.Target>

        <Combobox.Dropdown className="!rounded-2xl !border-[var(--chatbox-border-primary)] !shadow-lg overflow-hidden">
          <Combobox.Options mah={400} style={{ overflowY: 'auto' }} className="p-1">
            {providerGroups.map(({ provider, imageModels }, index) => (
              <div key={provider.id}>
                {index > 0 && <Divider my="xs" />}
                <Combobox.Group
                  label={provider.name}
                  classNames={{ groupLabel: '!text-xs !font-semibold !uppercase tracking-wide' }}
                >
                  {imageModels.map((model) => (
                    <Combobox.Option
                      key={`${provider.id}:${model.modelId}`}
                      value={`${provider.id}:${model.modelId}`}
                      className="!rounded-lg"
                    >
                      <Text size="sm">{model.displayName}</Text>
                    </Combobox.Option>
                  ))}
                </Combobox.Group>
              </div>
            ))}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    )
  }
)

ImageModelSelect.displayName = 'ImageModelSelect'

export default ImageModelSelect
