import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/components/auth/AuthProvider'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authProvider?: boolean
  authUser?: any
}

export function renderWithProviders(
  ui: ReactElement,
  {
    authProvider = true,
    authUser = null,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    if (authProvider) {
      return <AuthProvider initialUser={authUser}>{children}</AuthProvider>
    }
    return <>{children}</>
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

export * from '@testing-library/react'
export { renderWithProviders as render }
