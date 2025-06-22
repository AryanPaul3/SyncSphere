
const Avatar = ({ name }) => {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const colorHash = name.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const colors = [ "bg-red-500", "bg-green-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500" ];
  const color = colors[Math.abs(colorHash) % colors.length];
  return (
    <div className={`w-10 h-10 rounded-full ${color} flex-shrink-0 flex items-center justify-center`}>
      <span className="text-white font-bold text-lg">{initial}</span>
    </div>
  );
};

export default Avatar
