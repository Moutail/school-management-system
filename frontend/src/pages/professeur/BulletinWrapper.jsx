// src/pages/professeur/BulletinWrapper.jsx
import { useParams } from 'react-router-dom';
import StudentBulletin from './StudentBulletin';

const BulletinWrapper = () => {
  const { eleveId } = useParams();
  return <StudentBulletin eleveId={eleveId} />;
};

export default BulletinWrapper;