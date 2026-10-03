import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import { PwaPromptHost } from '@/components/pwa/PwaPromptHost'
import {
  getUpdateCalls,
  resetPwaRegisterMock,
  triggerNeedRefresh,
  triggerRegisterError,
} from '@/test/pwaRegisterMock'
import { makeCaseRegistry } from '@/test/caseFixtures'

import {
  applyServiceWorkerUpdate,
  dismissServiceWorkerNotice,
  registerServiceWorker,
  useServiceWorkerStatus,
} from './registerSW'

function StatusProbe() {
  const status = useServiceWorkerStatus()
  return <p>{status.needRefresh ? 'Update waiting' : 'Current build active'}</p>
}

describe('service-worker update registration', () => {
  beforeEach(() => {
    resetPwaRegisterMock()
    dismissServiceWorkerNotice('needRefresh')
    dismissServiceWorkerNotice('offlineReady')
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {},
    })
  })

  it('surfaces a waiting worker and tells it to activate before reloading', async () => {
    const user = userEvent.setup()
    render(
      <ContentContext.Provider value={makeCaseRegistry()}>
        <PwaPromptHost />
      </ContentContext.Provider>,
    )
    registerServiceWorker()

    act(() => triggerNeedRefresh())
    expect(screen.getByRole('heading', { name: 'Update available' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Reload' }))
    expect(getUpdateCalls()).toEqual([true])
  })

  it('clears stale waiting state when service workers are blocked', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<StatusProbe />)
    registerServiceWorker()

    act(() => triggerNeedRefresh())
    act(() => triggerRegisterError(new Error('Service Worker registration blocked by browser')))

    expect(screen.getByText('Current build active')).toBeVisible()
    await applyServiceWorkerUpdate()
    expect(getUpdateCalls()).toEqual([])
    expect(consoleError).not.toHaveBeenCalled()
  })
})
