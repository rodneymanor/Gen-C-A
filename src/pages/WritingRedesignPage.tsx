import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WritingRedesignShowcase } from '../test/writing-redesign';

const WritingRedesignPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <WritingRedesignShowcase
      onNavigateNext={() => navigate('/collections')}
    />
  );
};

export default WritingRedesignPage;
