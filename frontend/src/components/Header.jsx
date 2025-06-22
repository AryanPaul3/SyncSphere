import { useAuthStore } from "../store/authStore";
import Logo from "./Logo";

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.106a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5h2.25a.75.75 0 0 1 .75.75ZM17.894 17.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.894 17.894a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM4.5 12a.75.75 0 0 1-.75.75H1.5a.75.75 0 0 1 0-1.5h2.25a.75.75 0 0 1 .75.75ZM6.106 6.106a.75.75 0 0 0-1.06 1.06l1.59 1.591a.75.75 0 1 0 1.061-1.06l-1.59-1.591Z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" className="w-6 h-6">
    <path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"/>
  </svg>
);


export default function Header() {
  const {logout , user , theme, toggleTheme} = useAuthStore();

  return (
    <div className="flex justify-between items-center p-4 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700 shadow-sm">
      <div className="flex items-center gap-3">
        <Logo className="h-8 w-8" /> 
        <h1 className="text-xl font-bold text-zinc-700 dark:text-zinc-200">
          SyncSphere
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <p>Welcome, <span className="font-semibold">{user.name}</span></p>

        
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>

        <button onClick={logout} className="bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors">
          Logout
        </button>
      </div>
    </div>
  );
}
