import { useState, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import Select from 'react-select';
import toast from 'react-hot-toast'


export default function AddChatModal() {
  const { isModalOpen, toggleModal, users, fetchUsers, addChat , createChat } = useChatStore();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const { theme } = useAuthStore();

  useEffect(() => {
    if (isModalOpen) {
      fetchUsers();
    }
  }, [isModalOpen, fetchUsers]);

  const userOptions = users.map(user => ({ value: user._id, label: user.name }));

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user.");
      return;
    }
    
    // For group chats, a name is required
    if (selectedUsers.length > 1 && !groupName.trim()) {
      toast.error("Please enter a group name.");
      return;
    }

    try {
      const payload = {
        userIds: selectedUsers.map(u => u.value),
        groupName: selectedUsers.length > 1 ? groupName : null,
      };
      
      const createdChat = await createChat(payload);

      toast.success("Chat created successfully!")
      addChat(createdChat); // Add the new chat to our state
      handleClose(); // Close and reset modal
    } catch (error) {
      console.error("Failed to create chat", error);
      alert("Error: " + (error.response?.data?.data || "Could not create chat."));
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setGroupName('');
    toggleModal();
  };

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: theme === 'dark' ? '#3F3F46' : '#FFF', // zinc-700
      borderColor: theme === 'dark' ? '#52525B' : '#D4D4D8', // zinc-600, zinc-300
      color: theme === 'dark' ? '#E4E4E7' : '#27272A', // zinc-200, zinc-800
      '&:hover': {
        borderColor: theme === 'dark' ? '#71717A' : '#A7F3D0', // zinc-500, teal-200
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: theme === 'dark' ? '#27272A' : '#FFF', // zinc-800
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#14B8A6' // teal-500
        : state.isFocused
        ? (theme === 'dark' ? '#3F3F46' : '#F4F4F5') // zinc-700, zinc-100
        : 'transparent',
      color: state.isSelected ? '#FFF' : (theme === 'dark' ? '#E4E4E7' : '#27272A'),
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: theme === 'dark' ? '#0D9488' : '#CCFBF1', // teal-600, teal-100
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: theme === 'dark' ? '#FFF' : '#134E4A', // white, teal-900
    }),
    input: (provided) => ({ ...provided, color: theme === 'dark' ? '#E4E4E7' : '#27272A' }),
    singleValue: (provided) => ({ ...provided, color: theme === 'dark' ? '#E4E4E7' : '#27272A' }),
  };

  if (!isModalOpen) return null;

  return (
    // --- MODIFIED: Applying the same robust modal pattern ---

    // 1. The Parent/Overlay: Handles the outside click to close.
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center dark:bg-black/60"
      onClick={handleClose}
    >
      {/* 2. The Content Box: Stops click propagation. */}
      <div 
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-2xl font-bold text-zinc-800 dark:text-zinc-100">Create a new Chat</h2>
        
        <div className="mb-4">
          <label htmlFor="users" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Select Users:</label>
          <Select
            isMulti
            options={userOptions}
            value={selectedUsers}
            onChange={setSelectedUsers}
            styles={customSelectStyles}
          />
        </div>

        {selectedUsers.length > 1 && (
          <div className="mb-4">
            <label htmlFor="groupName" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Group Name:</label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-transparent p-2 text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
              placeholder="Enter a name for your group"
            />
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button onClick={handleClose} className="rounded-md bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400 dark:bg-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-500">Cancel</button>
          <button onClick={handleCreateChat} className="rounded-md bg-teal-500 px-4 py-2 text-white hover:bg-teal-600">Create Chat</button>
        </div>
      </div>
    </div>
  );
}