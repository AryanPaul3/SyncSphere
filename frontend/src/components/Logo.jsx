import logoSrc from '../assets/SyncSphere.png'; 

const Logo = ({ className }) => {
  return (
    <img 
      src={logoSrc} 
      alt="SyncSphere Logo" 
      className={className} 
    />
  );
};

export default Logo;