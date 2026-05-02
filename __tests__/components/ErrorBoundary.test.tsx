import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  RefreshCw: ({ size }: { size: number }) => <svg data-testid="icon-refresh" data-size={size} />,
  AlertTriangle: ({ size }: { size: number }) => <svg data-testid="icon-alert" data-size={size} />,
  WifiOff: ({ size }: { size: number }) => <svg data-testid="icon-wifi-off" data-size={size} />,
}));

// ── Composant qui explose ─────────────────────────────────────────────────────

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Boom!');
  return <div>Contenu OK</div>;
}

// Supprime les console.error de React dans les tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalConsoleError;
  vi.clearAllMocks();
});

// ── Tests : rendu nominal ──────────────────────────────────────────────────────

describe('ErrorBoundary - rendu nominal', () => {
  it('affiche les enfants quand il n\'y a pas d\'erreur', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Contenu OK')).toBeInTheDocument();
  });

  it('n\'affiche pas de fallback quand tout va bien', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ── Tests : fallback admin (defaut) ───────────────────────────────────────────

describe('ErrorBoundary - fallback admin (variant par defaut)', () => {
  it('affiche le fallback admin quand une erreur est levee', () => {
    render(
      <ErrorBoundary zone="test/admin">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
  });

  it('affiche la zone identifiee dans le fallback admin', () => {
    render(
      <ErrorBoundary zone="planning/fullcalendar">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Zone : planning\/fullcalendar/)).toBeInTheDocument();
  });

  it('affiche "Erreur inattendue" quand aucune zone n\'est fournie', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Erreur inattendue')).toBeInTheDocument();
  });

  it('affiche un bouton Reessayer', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument();
  });

  it('remet les enfants apres un reset', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // On corrige d'abord la source d'erreur, puis on clique reset
    // (sinon le composant re-throw immediatement apres le reset)
    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByRole('button', { name: /réessayer/i }));

    expect(screen.getByText('Contenu OK')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ── Tests : fallback public ────────────────────────────────────────────────────

describe('ErrorBoundary - fallback public', () => {
  it('affiche le fallback public', () => {
    render(
      <ErrorBoundary variant="public">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/oups/i)).toBeInTheDocument();
  });

  it('affiche l\'icone WifiOff', () => {
    render(
      <ErrorBoundary variant="public">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('icon-wifi-off')).toBeInTheDocument();
  });

  it('affiche un bouton Reessayer', () => {
    render(
      <ErrorBoundary variant="public">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument();
  });

  it('remet les enfants apres un reset', () => {
    const { rerender } = render(
      <ErrorBoundary variant="public">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    // Corrige d'abord la source d'erreur avant de cliquer reset
    rerender(
      <ErrorBoundary variant="public">
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByRole('button', { name: /réessayer/i }));
    expect(screen.getByText('Contenu OK')).toBeInTheDocument();
  });
});

// ── Tests : fallback widget ────────────────────────────────────────────────────

describe('ErrorBoundary - fallback widget', () => {
  it('affiche le fallback widget avec la zone', () => {
    render(
      <ErrorBoundary variant="widget" zone="booking/tunnel">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Erreur dans "booking\/tunnel"/)).toBeInTheDocument();
  });

  it('affiche le message generique quand la zone est absente', () => {
    render(
      <ErrorBoundary variant="widget">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Ce bloc a rencontré une erreur')).toBeInTheDocument();
  });

  it('affiche un bouton Reessayer', () => {
    render(
      <ErrorBoundary variant="widget">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument();
  });
});

// ── Tests : fallback personnalise ─────────────────────────────────────────────

describe('ErrorBoundary - fallback personnalise', () => {
  it('utilise le fallback fourni en prop plutot que le defaut', () => {
    render(
      <ErrorBoundary fallback={<div>Mon fallback custom</div>}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Mon fallback custom')).toBeInTheDocument();
    expect(screen.queryByText('Une erreur est survenue')).not.toBeInTheDocument();
  });
});

// ── Tests : Sentry ─────────────────────────────────────────────────────────────

describe('ErrorBoundary - integration Sentry', () => {
  it('appelle Sentry.captureException quand une erreur est capturee', async () => {
    const { captureException } = await import('@sentry/nextjs');

    render(
      <ErrorBoundary zone="sentry/test">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(captureException).toHaveBeenCalledOnce();
    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({ zone: 'sentry/test' }),
      })
    );
  });

  it('passe "unknown" comme zone si la prop est absente', async () => {
    const { captureException } = await import('@sentry/nextjs');

    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({ zone: 'unknown' }),
      })
    );
  });
});
