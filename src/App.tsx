import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ProjectListPage } from './pages/ProjectListPage';
import { ReportDetailPage } from './pages/ReportDetailPage';

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<ProjectListPage />} />
        <Route path="/report/:id" element={<ReportDetailPage />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
