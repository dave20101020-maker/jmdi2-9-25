import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // You could send this to a logging service
    console.error('Uncaught React error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-600 text-white">
          <h2 className="font-bold text-lg">Something went wrong</h2>
          <p className="text-sm">{this.state.error?.message || 'An unexpected error occurred.'}</p>
        </div>
      )
    }
    return this.props.children
  }
}
