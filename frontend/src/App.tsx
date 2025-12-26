import { useState, useCallback } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ActivityList } from './components/ActivityList';
import { ActivityForm } from './components/ActivityForm';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32',
    },
    secondary: {
      main: '#00695c',
    },
  },
});

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleActivityCreated = useCallback(() => {
    handleRefresh();
    setCurrentView('activities');
  }, [handleRefresh]);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard refreshTrigger={refreshTrigger} />;
      case 'activities':
        return (
          <ActivityList
            refreshTrigger={refreshTrigger}
            onActivityDeleted={handleRefresh}
          />
        );
      case 'add':
        return <ActivityForm onSuccess={handleActivityCreated} />;
      default:
        return <Dashboard refreshTrigger={refreshTrigger} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout currentView={currentView} onNavigate={setCurrentView}>
        {renderContent()}
      </Layout>
    </ThemeProvider>
  );
}

export default App;
