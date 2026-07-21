import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

import {
  getBulletins,
  createBulletin,
  publishBulletin,
  stopBulletin,
  deleteBulletin,
} from "../services/bulletinService";


function LiveBulletins() {
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "Announcement",
    priority: "Medium",
    target_location: "",
    languages: "",
    channels: "",
    expires_at: null,
  });


  // Load all bulletins
  const loadBulletins = async () => {
    try {
      setLoading(true);

      const data = await getBulletins();

      setBulletins(data);
    } catch (error) {
      console.error(
        "Error loading bulletins:",
        error
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadBulletins();
  }, []);


  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // Create bulletin
  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await createBulletin(formData);

      setShowModal(false);

      setFormData({
        title: "",
        content: "",
        category: "Announcement",
        priority: "Medium",
        target_location: "",
        languages: "",
        channels: "",
        expires_at: null,
      });

      await loadBulletins();

    } catch (error) {
      console.error(
        "Error creating bulletin:",
        error
      );

      alert(
        "Failed to create bulletin"
      );
    }
  };


  // Publish bulletin
  const handlePublish = async (id) => {
    try {
      await publishBulletin(id);

      await loadBulletins();

    } catch (error) {
      console.error(error);

      alert(
        "Failed to publish bulletin"
      );
    }
  };


  // Stop bulletin
  const handleStop = async (id) => {
    try {
      await stopBulletin(id);

      await loadBulletins();

    } catch (error) {
      console.error(error);

      alert(
        "Failed to stop bulletin"
      );
    }
  };


  // Delete bulletin
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this bulletin?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteBulletin(id);

      await loadBulletins();

    } catch (error) {
      console.error(error);

      alert(
        "Failed to delete bulletin"
      );
    }
  };


  return (
  <div className="flex min-h-screen bg-bg text-text">

    {/* Sidebar */}

    {/* Main Content */}
    <main className="flex-1 overflow-auto">

      <div className="p-6">

        {/* Header */}

        <div className="flex items-center justify-between mb-6">

          <div>
            <h1 className="text-2xl font-bold">
              Live Bulletins
            </h1>

            <p className="text-text-dim mt-1">
              Create and manage real-time public awareness bulletins.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-lg bg-violet text-white hover:opacity-90"
          >
            + Create Bulletin
          </button>

        </div>


        {/* Loading */}

        {loading && (
          <p className="text-text-dim">
            Loading bulletins...
          </p>
        )}


        {/* Empty State */}

        {!loading && bulletins.length === 0 && (

          <div className="bg-surface rounded-xl border border-border p-10 text-center">

            <h2 className="text-lg font-semibold">
              No bulletins found
            </h2>

            <p className="text-text-dim mt-2">
              Create your first public awareness bulletin.
            </p>

          </div>

        )}


        {/* Bulletin Cards */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {bulletins.map((bulletin) => (

            <div
              key={bulletin.id}
              className="bg-surface rounded-xl border border-border p-5 shadow-sm"
            >

              {/* Card Header */}

              <div className="flex justify-between items-start">

                <div>

                  <h2 className="text-lg font-semibold">
                    {bulletin.title}
                  </h2>

                  <p className="text-sm text-text-dim mt-1">
                    {bulletin.category}
                  </p>

                </div>


                {/* Status */}

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    bulletin.status === "Live"
                      ? "bg-green-500/20 text-green-400"
                      : bulletin.status === "Stopped"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {bulletin.status}
                </span>

              </div>


              {/* Content */}

              <p className="mt-4 text-text-dim">
                {bulletin.content}
              </p>


              {/* Details */}

              <div className="mt-4 space-y-2 text-sm text-text-dim">

                <p>
                  <strong className="text-text">
                    Priority:
                  </strong>{" "}
                  {bulletin.priority}
                </p>

                <p>
                  <strong className="text-text">
                    Location:
                  </strong>{" "}
                  {bulletin.target_location || "All locations"}
                </p>

                <p>
                  <strong className="text-text">
                    Languages:
                  </strong>{" "}
                  {bulletin.languages || "Not specified"}
                </p>

                <p>
                  <strong className="text-text">
                    Channels:
                  </strong>{" "}
                  {bulletin.channels || "Not specified"}
                </p>

              </div>


              {/* Actions */}

              <div className="flex gap-2 mt-5">

                {bulletin.status === "Draft" && (

                  <button
                    onClick={() => handlePublish(bulletin.id)}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                  >
                    Publish
                  </button>

                )}


                {bulletin.status === "Live" && (

                  <button
                    onClick={() => handleStop(bulletin.id)}
                    className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600"
                  >
                    Stop
                  </button>

                )}


                <button
                  onClick={() => handleDelete(bulletin.id)}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>


      {/* Create Bulletin Modal */}

      {showModal && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">

          <div className="bg-surface rounded-xl w-full max-w-2xl p-6 border border-border">

            {/* Modal Header */}

            <div className="flex justify-between items-center mb-5">

              <h2 className="text-xl font-bold">
                Create Live Bulletin
              </h2>

              <button
                onClick={() => setShowModal(false)}
                className="text-text-dim hover:text-text text-xl"
              >
                ×
              </button>

            </div>


            {/* Form */}

            <form
              onSubmit={handleCreate}
              className="space-y-4"
            >

              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Bulletin title"
                required
                className="w-full bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-dim"
              />


              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Enter bulletin content"
                required
                rows="4"
                className="w-full bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-dim"
              />


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-text"
                >

                  <option value="Announcement">
                    Announcement
                  </option>

                  <option value="Emergency">
                    Emergency
                  </option>

                  <option value="Awareness">
                    Awareness
                  </option>

                  <option value="Education">
                    Education
                  </option>

                </select>


                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-text"
                >

                  <option value="Low">
                    Low
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="High">
                    High
                  </option>

                  <option value="Critical">
                    Critical
                  </option>

                </select>

              </div>


              <input
                name="target_location"
                value={formData.target_location}
                onChange={handleChange}
                placeholder="Target location"
                className="w-full bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-dim"
              />


              <input
                name="languages"
                value={formData.languages}
                onChange={handleChange}
                placeholder="Languages (e.g. English, Telugu)"
                className="w-full bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-dim"
              />


              <input
                name="channels"
                value={formData.channels}
                onChange={handleChange}
                placeholder="Channels (e.g. Website, SMS)"
                className="w-full bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-dim"
              />


              {/* Buttons */}

              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-border text-text-dim hover:text-text"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-violet text-white hover:opacity-90"
                >
                  Create Bulletin
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>

  </div>
);
}

export default LiveBulletins;