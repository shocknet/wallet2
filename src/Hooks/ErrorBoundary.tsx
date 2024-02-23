import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  errorMSG: string;
}

class ErrorBoundary extends React.Component<any, ErrorBoundaryState> {
    constructor(props: any) {
        super(props);

        this.state = { 
          hasError: false,
          errorMSG: ''
        };
    }

    componentDidCatch(error: any, errorInfo: any) {
      console.log({ error, errorInfo });
      this.setState({ hasError: true, errorMSG: error.toString() });
    }

    GoBack = () => {
      this.setState({ hasError: false });
      window.history.back();
    }

    render() {
      if (this.state.hasError) {
          return (
            <div className='error-page'>
              <div>
                  <button onClick={this.GoBack}>Go back</button>
              </div>
              <h2>Oops, something went wrong.</h2>
              <br />
              <p>{this.state.errorMSG}</p>
              <button onClick={() => this.setState({ hasError: false })}>Send report</button>
            </div>
          )
      }

      return this.props.children;
    }
}

export default ErrorBoundary;