import { useState, useCallback } from 'react';
import { ThemeProvider, createTheme, CssBaseline, CircularProgress, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ActivityList } from './components/ActivityList';
import { ActivityForm } from './components/ActivityForm';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { ClaimActivitiesDialog } from './components/ClaimActivitiesDialog';

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

function AppContent() {
  const { loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showClaimDialog, setShowClaimDialog] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleActivityCreated = useCallback(() => {
    handleRefresh();
    setCurrentView('activities');
  }, [handleRefresh]);

  const handleAuthSuccess = useCallback((hasGuestActivities: boolean) => {
    if (hasGuestActivities) {
      setShowClaimDialog(true);
    } else {
      setCurrentView('dashboard');
      handleRefresh();
    }
  }, [handleRefresh]);

  const handleClaimComplete = useCallback(() => {
    setShowClaimDialog(false);
    setCurrentView('dashboard');
    handleRefresh();
  }, [handleRefresh]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

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
      case 'login':
        return (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToSignup={() => setCurrentView('signup')}
          />
        );
      case 'signup':
        return (
          <SignupForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        );
      default:
        return <Dashboard refreshTrigger={refreshTrigger} />;
    }
  };

  return (
    <>
      <Layout currentView={currentView} onNavigate={setCurrentView}>
        {renderContent()}
      </Layout>
      <ClaimActivitiesDialog
        open={showClaimDialog}
        onClose={() => {
          setShowClaimDialog(false);
          setCurrentView('dashboard');
          handleRefresh();
        }}
        onClaimed={handleClaimComplete}
      />
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
