import { ModelProviderEnum } from '../types'

// Re-export getModel and getProviderSettings from providers for backward compatibility
// This allows existing imports like `import { getModel } from '@shared/models'` to continue working
export { getModel, getProviderSettings } from '../providers'

export const aiProviderNameHash: Record<ModelProviderEnum, string> = {
  [ModelProviderEnum.Wanjie]: 'Wanjie API',
  [ModelProviderEnum.OpenAI]: 'OpenAI API',
  [ModelProviderEnum.OpenAIResponses]: 'OpenAI Responses API',
  [ModelProviderEnum.Azure]: 'Azure OpenAI API',
  [ModelProviderEnum.ChatGLM6B]: 'ChatGLM API',
  [ModelProviderEnum.Claude]: 'Claude API',
  [ModelProviderEnum.Gemini]: 'Google Gemini API',
  [ModelProviderEnum.Ollama]: 'Ollama API',
  [ModelProviderEnum.Groq]: 'Groq API',
  [ModelProviderEnum.DeepSeek]: 'DeepSeek API',
  [ModelProviderEnum.SiliconFlow]: 'SiliconFlow API',
  [ModelProviderEnum.VolcEngine]: 'VolcEngine API',
  [ModelProviderEnum.MistralAI]: 'MistralAI',
  [ModelProviderEnum.LMStudio]: 'LM Studio API',
  [ModelProviderEnum.Perplexity]: 'Perplexity API',
  [ModelProviderEnum.XAI]: 'xAI API',
  [ModelProviderEnum.OpenRouter]: 'OpenRouter API',
  [ModelProviderEnum.Custom]: 'Custom Provider',
}

export const AIModelProviderMenuOptionList = [
  {
    value: ModelProviderEnum.Wanjie,
    label: aiProviderNameHash[ModelProviderEnum.Wanjie],
    disabled: false,
  },
]
