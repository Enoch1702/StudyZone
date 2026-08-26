import { Component } from 'react'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { Button } from './Button'

/**
 * Robust React Error Boundary component catching render exceptions
 * and displaying a user-friendly recovery interface.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled StudyZone runtime error caught by ErrorBoundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
          <div className="max-w-md w-full rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-danger/10 text-danger border border-danger/20">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-lg font-bold text-foreground sm:text-xl">
                Something went wrong
              </h1>
              <p className="text-xs text-muted leading-relaxed">
                An unexpected error occurred while rendering this page. Your saved study data remains safe.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="rounded-xl border border-border-subtle bg-surface-raised/60 p-3 text-left">
                <p className="text-[11px] font-mono text-muted line-clamp-3 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <Button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto gap-2 text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reload Page</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  window.location.href = '/dashboard'
                }}
                className="w-full sm:w-auto gap-2 text-xs font-semibold cursor-pointer"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
