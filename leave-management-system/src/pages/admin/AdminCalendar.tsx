import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import { EventClickArg } from "@fullcalendar/core";
import { Dialog } from "@headlessui/react";
import axios from "axios";
import toast from "react-hot-toast";
import LeaveForm from "../employee/LeaveForm";

interface LeaveDetails {
  _id: string;
  type: string;
  duration: string;
  category: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
  createdAt: string;
  department: string;
  userId: {
    _id: string;
    name: string;
    email?: string;
  };
  comment?: string;
}

const AdminCalendar = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const [viewDetails, setViewDetails] = useState<LeaveDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [comment, setComment] = useState("");
  const API = process.env.REACT_APP_API_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API}/leave/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = res.data.map((item: LeaveDetails) => {
        const start = new Date(item.startDate).toISOString().split("T")[0];
        const end = new Date(new Date(item.endDate).getTime() + 86400000)
          .toISOString()
          .split("T")[0];

        let bgColor = "#facc15"; // yellow
        if (item.status === "Approved") bgColor = "#22c55e"; // green
        else if (item.status === "Rejected") bgColor = "#ef4444"; // red

        return {
          id: item._id,
          title: `${item.userId?.name || "Unknown"} – ${
            item.department || "—"
          }`,
          start,
          end,
          allDay: true,
          backgroundColor: bgColor,
          borderColor: bgColor,
        };
      });

      setEvents(formatted);
    } catch (err) {
      console.error("Error loading admin calendar events", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDateClick = (arg: DateClickArg) => {
    setSelectedDate(new Date(arg.dateStr));
    setIsOpen(true);
  };

  const handleEventClick = async (arg: EventClickArg) => {
    const id = arg.event.id;
    try {
      const res = await axios.get(`${API}/leave/one/${id}`);
      setViewDetails(res.data);
      setShowDetails(true);
    } catch (err) {
      console.error("Failed to load leave details", err);
    }
  };

  const handleAction = async (status: "Approved" | "Rejected" | "Pending") => {
    if (!viewDetails) return;
    try {
      await axios.put(
        `${API}/leave/admin/leave/${viewDetails._id}`,
        { status, comment },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(
        status === "Pending"
          ? "Approval cancelled."
          : `Leave ${status.toLowerCase()} successfully.`
      );
      setShowDetails(false);
      setComment("");
      fetchEvents();
    } catch (err) {
      console.error("Error updating leave", err);
    }
  };

  const cancelOwnPendingLeave = async () => {
    if (!viewDetails?._id) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this leave?"
    );
    if (!confirmed) return;

    try {
      await axios.delete(`${API}/leave/${viewDetails._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Your leave has been cancelled.");
      setShowDetails(false);
      fetchEvents();
    } catch (err) {
      toast.error("Failed to cancel your leave.");
      console.error("Cancel leave error:", err);
    }
  };

  const deleteLeave = async () => {
    if (!viewDetails?._id) return;
    const confirmed = window.confirm(
      `Delete this ${viewDetails.status.toLowerCase()} leave?`
    );
    if (!confirmed) return;

    try {
      await axios.delete(`${API}/leave/${viewDetails._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Leave deleted.");
      setShowDetails(false);
      fetchEvents();
    } catch (err) {
      toast.error("Failed to delete leave.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow p-4 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Admin Leave Calendar
        </h1>
        <div className="cursor-pointer">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            events={events}
            height="auto"
          />
        </div>
      </div>

      {/* Leave Form Dialog */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-lg w-full rounded bg-white p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold mb-4">
              File Leave — {selectedDate?.toDateString()}
            </Dialog.Title>
            <LeaveForm
              selectedDate={selectedDate}
              closeModal={() => setIsOpen(false)}
              onSuccess={fetchEvents}
            />
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Leave Details Dialog */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full rounded bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-bold mb-4 text-gray-800">
              Leave Details
            </Dialog.Title>

            {viewDetails && (
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Name:</strong> {viewDetails.userId.name}
                </p>
                <p>
                  <strong>Duration:</strong> {viewDetails.duration}
                </p>
                <p>
                  <strong>Category:</strong> {viewDetails.category}
                </p>
                <p>
                  <strong>Department:</strong> {viewDetails.department}
                </p>
                <p>
                  <strong>Start:</strong>{" "}
                  {new Date(viewDetails.startDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>End:</strong>{" "}
                  {new Date(viewDetails.endDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Status:</strong> {viewDetails.status}
                </p>
                {viewDetails.reason && (
                  <p>
                    <strong>Reason:</strong> {viewDetails.reason}
                  </p>
                )}
                {viewDetails.comment && (
                  <p>
                    <strong>Comment:</strong> {viewDetails.comment}
                  </p>
                )}
              </div>
            )}

            {viewDetails?.status === "Pending" && (
              <div className="mt-4 space-y-2">
                <textarea
                  placeholder="Comment (optional)"
                  className="w-full border p-2 rounded text-sm"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleAction("Approved")}
                    className="bg-green-500 text-white px-4 py-1 rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction("Rejected")}
                    className="bg-red-500 text-white px-4 py-1 rounded"
                  >
                    Reject
                  </button>

                  {/* ✅ Show Cancel My Leave ONLY if current user owns the leave */}
                  {viewDetails.userId._id === user._id && (
                    <button
                      onClick={cancelOwnPendingLeave}
                      className="bg-yellow-500 text-white px-4 py-1 rounded"
                    >
                      Cancel My Leave
                    </button>
                  )}
                </div>
              </div>
            )}

            {viewDetails && viewDetails.status === "Approved" && (
              <div className="mt-4">
                <button
                  onClick={() => handleAction("Pending")}
                  className="bg-yellow-500 text-white px-4 py-1 rounded"
                >
                  Cancel Approval
                </button>
              </div>
            )}

            {viewDetails && viewDetails.status !== "Pending" && (
              <div className="mt-4">
                <button
                  onClick={deleteLeave}
                  className="bg-red-600 text-white px-4 py-1 rounded"
                >
                  Delete Leave
                </button>
              </div>
            )}

            <div className="mt-6 text-right">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminCalendar;
