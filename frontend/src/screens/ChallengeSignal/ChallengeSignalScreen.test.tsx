import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createControlledApi } from '../../test/controlledApi'
import { renderApp } from '../../test/renderApp'

function openChallenge(route: string) {
  const controlled = createControlledApi({ hold: ['challenge'] })
  const { user } = renderApp({ route, api: controlled.api })
  return { user, controlled }
}

describe('ChallengeSignalScreen', () => {
  it('starts the challenge on a cold open', async () => {
    const { controlled } = openChallenge('/challenge/bbri')
    expect(screen.getByRole('heading', { level: 1, name: 'Challenge Signal' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Challenging the BBRI signal…')
    expect(screen.getByRole('link', { name: 'Back to investigation' })).toHaveAttribute('href', '/investigate/BBRI')
    expect(controlled.calls.challenge).toBe(1)
    await controlled.resolve('challenge')
  })

  it('shows the initial signal, the challenge finding and the strength', async () => {
    const { controlled } = openChallenge('/challenge/BBRI')
    await controlled.resolve('challenge')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('BBRI showed an unusual price-volume movement.')).toBeInTheDocument()
    expect(screen.getByText('Peer stocks showed a smaller, similar movement.')).toBeInTheDocument()
    expect(screen.getByText('Moderate')).toBeInTheDocument()
  })

  it('shows the message from the backend and recovers with Retry', async () => {
    const { user, controlled } = openChallenge('/challenge/BBRI')
    await controlled.reject('challenge', 'Run the investigation for BBRI first.')
    expect(screen.getByRole('alert')).toHaveTextContent('Run the investigation for BBRI first.')

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(controlled.calls.challenge).toBe(2)
    await controlled.resolve('challenge')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('opens the evidence brief', async () => {
    const { user, controlled } = openChallenge('/challenge/BBRI')
    await controlled.resolve('challenge')
    await user.click(screen.getByRole('button', { name: 'View evidence' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Evidence Brief' })).toBeInTheDocument()
  })
})