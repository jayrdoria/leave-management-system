import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import { EventClickArg } from "@fullcalendar/core";
import { Dialog } from "@headlessui/react";
import axios from "axios";
import LeaveForm from "./LeaveForm";
import toast from "react-hot-toast";

interface LeaveEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
}

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
  user?: {
    _id: string;
    name: string;
    email?: string;
  };
}

interface LoggedInUser {
  _id: string;
  name: string;
  email?: string;
  role?: string;
  department?: string;
}

const EmployeeCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const [viewDetails, setViewDetails] = useState<LeaveDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const user: LoggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
  const API = process.env.REACT_APP_API_BASE_URL;

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const res = await axios.get(`${API}/leave/scoped`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = res.data.map((item: any) => {
        const start = new Date(item.startDate).toISOString().split("T")[0];
        const end = new Date(new Date(item.endDate).getTime() + 86400000)
          .toISOString()
          .split("T")[0];

        let bgColor = "#facc15";
        if (item.status === "Approved") bgColor = "#22c55e";
        else if (item.status === "Rejected") bgColor = "#ef4444";

        const label =
          item.userId?.name === user.name
            ? `${item.category} – Me`
            : `${item.category} – ${item.userId?.name}`;

        return {
          id: item._id,
          title: label,
          start,
          end,
          allDay: true,
          backgroundColor: bgColor,
          borderColor: bgColor,
        };
      });

      setEvents(formatted);
    } catch (err) {
      toast.error("Error loading calendar");
      console.error("Error loading scoped events", err);
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
      console.error("Failed to load leave details");
    }
  };

  const cancelLeave = async () => {
    if (!viewDetails?._id) return;
    try {
      const token = localStorage.getItem("token"); // ✅ Add this line
      await axios.delete(`${API}/leave/${viewDetails._id}`, {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Attach token
        },
      });
      toast.success("Leave cancelled successfully."); // ✅ success toast
      setShowDetails(false);
      fetchEvents();
    } catch (err) {
      toast.error("Failed to cancel leave."); // ❌ error toast
      console.error("Failed to cancel leave");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow p-4 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          My Leave Calendar
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

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-lg w-full rounded bg-white p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold mb-4">
              Apply for Leave — {selectedDate?.toDateString()}
            </Dialog.Title>
            <LeaveForm
              selectedDate={selectedDate}
              closeModal={() => setIsOpen(false)}
              onSuccess={fetchEvents}
            />
          </Dialog.Panel>
        </div>
      </Dialog>

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
                  <span className="font-semibold">Duration:</span>{" "}
                  {viewDetails.duration}
                </p>
                <p>
                  <span className="font-semibold">Category:</span>{" "}
                  {viewDetails.category}
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
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              {viewDetails?.status === "Pending" &&
                viewDetails?.user?._id === user._id && (
                  <button
                    onClick={cancelLeave}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Cancel Leave
                  </button>
                )}

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

export default EmployeeCalendar;
