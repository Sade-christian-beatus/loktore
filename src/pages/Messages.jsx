import { useTranslation } from 'react-i18next'

export default function Messages() {
  const { t } = useTranslation()
  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-slate-800">{t('messages.title')}</h1>
      <div className="mt-10 flex flex-col items-center gap-3 text-center text-slate-400">
        <span className="text-5xl">💬</span>
        <p>{t('messages.empty')}</p>
        <p className="text-sm">{t('messages.soon')}</p>
      </div>
    </div>
  )
}
