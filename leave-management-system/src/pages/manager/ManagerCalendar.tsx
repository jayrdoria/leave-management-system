import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import { EventClickArg } from "@fullcalendar/core";
import { Dialog } from "@headlessui/react";
import axios from "axios";
import LeaveForm from "../employee/LeaveForm";
import toast from "react-hot-toast";

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

const ManagerCalendar = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const [viewDetails, setViewDetails] = useState<LeaveDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [comment, setComment] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const fetchEvents = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5050/api/leave/manager/leaves",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

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
          title: `${item.userId.name} – ${item.department}`,
          start,
          end,
          allDay: true,
          backgroundColor: bgColor,
          borderColor: bgColor,
        };
      });

      setEvents(formatted);
    } catch (err) {
      console.error("Error loading manager calendar events", err);
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
      const res = await axios.get(`http://localhost:5050/api/leave/one/${id}`);
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
        `http://localhost:5050/api/leave/manager/leave/${viewDetails._id}`,
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
      console.error("Error updating leave", err);
    }
  };

  const cancelOwnLeave = async () => {
    if (!viewDetails?._id) return;
    try {
      await axios.delete(`http://localhost:5050/api/leave/${viewDetails._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Leave cancelled successfully.");
      setShowDetails(false);
      fetchEvents();
    } catch (err) {
      toast.error("Failed to cancel leave.");
      console.error("Failed to cancel leave");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow p-4 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Manager Leave Calendar
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

      {/* Leave Filing Dialog */}
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
                  <span className="font-semibold">Name:</span>{" "}
                  {viewDetails.userId.name}
                </p>

                <p>
                  <span className="font-semibold">Duration:</span>{" "}
                  {viewDetails.duration}
                </p>

                <p>
                  <span className="font-semibold">Category:</span>{" "}
                  {viewDetails.category}
                </p>
                <p>
                  <span className="font-semibold">Department:</span>{" "}
                  {viewDetails.department}
                </p>
                <p>
                  <span className="font-semibold">Start:</span>{" "}
                  {new Date(viewDetails.startDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold">End:</span>{" "}
                  {new Date(viewDetails.endDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{" "}
                  {viewDetails.status}
                </p>
                {viewDetails.reason && (
                  <p>
                    <span className="font-semibold">Reason:</span>{" "}
                    {viewDetails.reason}
                  </p>
                )}
                {viewDetails.comment && (
                  <p>
                    <span className="font-semibold">Manager Comment:</span>{" "}
                    {viewDetails.comment}
                  </p>
                )}
              </div>
            )}

            {/* Manager Actions */}
            {viewDetails?.status === "Pending" && (
              <div className="mt-4 space-y-2">
                <textarea
                  placeholder="Add comment (optional)"
                  className="w-full border p-2 rounded text-sm"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="flex gap-2 flex-wrap">
                  {/* Approve / Reject for all pending leaves */}
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

                  {/* ✅ Show Cancel only for own leave */}
                  {viewDetails.userId._id === user._id && (
                    <button
                      onClick={cancelOwnLeave}
                      className="bg-yellow-500 text-white px-4 py-1 rounded"
                    >
                      Cancel My Leave
                    </button>
                  )}
                </div>
              </div>
            )}

            {viewDetails &&
              viewDetails.status === "Approved" &&
              user.role === "manager" && (
                <div className="mt-4">
                  <button
                    onClick={() => handleAction("Pending")}
                    className="bg-yellow-500 text-white px-4 py-1 rounded"
                  >
                    Cancel Approval
                  </button>
                </div>
              )}

            {viewDetails &&
              user.role === "manager" &&
              (viewDetails.status === "Approved" ||
                viewDetails.status === "Rejected") && (
                <div className="mt-4">
                  <button
                    onClick={async () => {
                      const confirmed = window.confirm(
                        `Are you sure you want to delete this ${viewDetails.status.toLowerCase()} leave?`
                      );
                      if (!confirmed) return;

                      try {
                        await axios.delete(
                          `http://localhost:5050/api/leave/${viewDetails._id}`,
                          {
                            headers: { Authorization: `Bearer ${token}` },
                          }
                        );
                        toast.success("Leave deleted successfully.");
                        setShowDetails(false);
                        fetchEvents();
                      } catch (err) {
                        toast.error("Failed to delete leave.");
                        console.error("Delete leave error", err);
                      }
                    }}
                    className="bg-red-600 text-white px-4 py-1 rounded"
                  >
                    Delete {viewDetails.status} Leave
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

export default ManagerCalendar;
