import React, { useState } from "react";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

function CompanyCalendar() {
  const [events, setEvents] = useState([
    {
      title: "Team Meeting",
      start: new Date(2025, 10, 5, 10, 0),
      end: new Date(2025, 10, 5, 11, 0),
    },
    {
      title: "Project Deadline",
      start: new Date(2025, 10, 8),
      end: new Date(2025, 10, 8),
    },
  ]);

  const handleSelectSlot = ({ start, end }) => {
    const title = window.prompt("Enter new event title:");
    if (title) {
      setEvents([...events, { start, end, title }]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-md px-8 py-4 flex justify-between items-center border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
          📅 Company Calendar
        </h2>
        <button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md transition-all duration-300 transform hover:scale-105">
          + Add Event
        </button>
      </div>

      {/* Main Calendar */}
      <div className="flex-1 flex items-center justify-center px-8 py-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 w-full">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            selectable
            onSelectSlot={handleSelectSlot}
            style={{ height: "75vh" }}
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/80 border-t border-gray-200 px-8 py-4 text-sm text-gray-700 flex justify-between items-center">
        <p className="font-semibold text-gray-900">
          Total Events: {events.length}
        </p>
        <p className="text-gray-500 italic">
          Stay organized and never miss an important event!
        </p>
      </div>
    </div>
  );
}

export default CompanyCalendar;
