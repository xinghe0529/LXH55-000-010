import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProposalsPage from '@/pages/ProposalsPage';
import ProposalComparePage from '@/pages/ProposalComparePage';
import VotePanelPage from '@/pages/VotePanelPage';
import ProgressBoardPage from '@/pages/ProgressBoardPage';
import DailyReportsPage from '@/pages/DailyReportsPage';
import NewProposalModal from '@/components/NewProposalModal';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/proposals" replace />} />
          <Route path="/proposals" element={<ProposalsPage />} />
          <Route path="/proposals/compare" element={<ProposalComparePage />} />
          <Route path="/proposal/:id/vote" element={<VotePanelPage />} />
          <Route path="/proposal/:id/progress" element={<ProgressBoardPage />} />
          <Route path="/proposal/:id/daily-reports" element={<DailyReportsPage />} />
          <Route path="*" element={<Navigate to="/proposals" replace />} />
        </Route>
      </Routes>
      <NewProposalModal />
    </Router>
  );
}
