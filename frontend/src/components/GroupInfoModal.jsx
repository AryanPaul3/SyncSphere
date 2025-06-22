// --components/GroupInfoModal.jsx

import { useChatStore } from "../store/chatStore";
import Avatar from "./Avatar";

export default function GroupInfoModal() {
  const { isGroupInfoModalOpen, closeGroupInfoModal, selectedChat } = useChatStore();

  if (!isGroupInfoModalOpen || !selectedChat || !selectedChat.isGroupChat) {
    return null;
  }

  return (
    // --- THE FIX: A SINGLE PARENT CONTAINER ---
    // This parent div handles everything:
    // - Positioning (absolute, inset-0, z-50)
    // - Background overlay (bg-black/50)
    // - Centering its child (flex, justify-center, items-center)
    // - The "close on outside click" logic (onClick)
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={closeGroupInfoModal}
    >
      {/* The Content Box */}
      {/* This is the direct child. Clicks inside here will be stopped from bubbling up. */}
      <div
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800"
        onClick={(e) => e.stopPropagation()} // This is the key for event handling.
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{selectedChat.name}</h2>
          <button
            onClick={closeGroupInfoModal}
            className="text-2xl font-bold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ×
          </button>
        </div>

        <h3 className="mb-2 text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Participants ({selectedChat.participants.length})
        </h3>

        <div className="max-h-80 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          {selectedChat.participants.map((participant) => (
            <div
              key={participant._id}
              className="flex items-center justify-between rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <div className="flex items-center gap-3">
                <Avatar name={participant.name} />
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{participant.name}</span>
              </div>
              {participant._id === selectedChat.admin._id && (
                <span className="rounded-full bg-teal-100 px-2 py-1 text-xs font-bold text-teal-500 dark:bg-zinc-900 dark:text-teal-400">
                  Admin
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}