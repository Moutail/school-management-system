import { useState, useEffect } from 'react'; 
import PropTypes from 'prop-types'; 
import Sidebar from '../Sidebar'; 
// import { getUnreadMessagesCount } from '../../services/api'; // Commenté pour éviter les erreurs

export default function DashboardLayout({ children }) {   
  const [unreadMessages, setUnreadMessages] = useState(0);    
  
  useEffect(() => {     
    const checkUnreadMessages = async () => {       
      try {         
        // Comme la route n'est pas encore implémentée, utilisez une valeur par défaut
        // const data = await getUnreadMessagesCount();         
        // setUnreadMessages(data.count);
        setUnreadMessages(0); // Valeur par défaut temporaire
      } catch (error) {         
        console.error('Erreur lors de la vérification des messages:', error);       
      }     
    };        
    
    checkUnreadMessages();     
    const interval = setInterval(checkUnreadMessages, 60000);     
    return () => clearInterval(interval);   
  }, []);    
  
  return (     
    <div className="min-h-screen bg-gray-50">       
      <Sidebar unreadMessages={unreadMessages} />              
      {/* Main Content */}       
      <div className="lg:pl-64 min-h-screen">         
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">           
          {children}         
        </div>       
      </div>     
    </div>   
  ); 
}  

DashboardLayout.propTypes = {   
  children: PropTypes.node.isRequired, 
};