import React, { useState, useEffect } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const errorHandler = (): void => {
            setHasError(true);
        };

        window.addEventListener('error', errorHandler);

        return () => {
            window.removeEventListener('error', errorHandler);
        };
    }, []);

  const GoBack = () => {
    setHasError(false);
    window.history.back();
  }

  if (hasError) {
    // Render the error page here
    return (
        <div className='error-page'>
            <div>
                <button onClick={GoBack}>Go back</button>
            </div>
            <h2>Oops, something went wrong.</h2>
            <button onClick={() => setHasError(false)}>Try again?</button>
        </div>
    );
  }

  return children;
};

export default ErrorBoundary;