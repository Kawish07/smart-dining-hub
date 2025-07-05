// app/dashboard/reservations/page.js
"use client";
import { useEffect, useState } from "react";
import { Clock, Check, Play, MessageSquare, Monitor, Loader2 } from "lucide-react";

function formatReservationDateTime(date, time) {
  if (!date || !time) return "";
  const isoString = `${date}T${time.length === 5 ? time : time.padStart(5, "0")}`;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return `${date} at ${time}`;
  return (
    d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }) +
    " at " +
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
  );
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all', 'today', 'upcoming'
  const [isLoading, setIsLoading] = useState(true);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reservations?filter=${filter}`);

      if (!response.ok) throw new Error("Failed to fetch reservations");

      const data = await response.json();
      setReservations(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();

    // Real-time updates with polling
    const interval = setInterval(fetchReservations, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error("Update failed");
      fetchReservations(); // Refresh data
    } catch (error) {
      console.error("Error:", error);
    }
  };
  // Add to your dashboard component
  useEffect(() => {
    const eventSource = new EventSource('/api/reservations/updates');

    eventSource.onmessage = (event) => {
      const updatedReservation = JSON.parse(event.data);
      setReservations(prev =>
        prev.map(r =>
          r._id === updatedReservation._id ? updatedReservation : r
        )
      );
    };

    return () => eventSource.close();
  }, []);

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      // You can add a toast notification here if you have one
      console.log(`${type} copied to clipboard`);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Clock className="mr-2" /> Reservations
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-md ${filter === "all" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("today")}
            className={`px-3 py-1 rounded-md ${filter === "today" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-3 py-1 rounded-md ${filter === "upcoming" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
          >
            Upcoming
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reservations found
            </div>
          ) : (
            reservations.map(reservation => (
              <div key={reservation._id} className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Table and Basic Info */}
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="font-medium text-lg">
                        Table #{reservation.tableNumber}
                      </p>
                      <span className="text-sm text-gray-500">
                        (Max {reservation.tableCapacity})
                      </span>
                    </div>

                    {/* Date and Time */}
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">📅</span> {formatReservationDateTime(reservation.date, reservation.time)}
                    </p>

                    {/* Party Size */}
                    <p className="text-sm mb-3">
                      <span className="font-medium">👥</span> {reservation.persons} {reservation.persons === 1 ? "person" : "people"}
                    </p>

                    {/* User Information Section */}
                    {(reservation.customerName || reservation.customerPhone || reservation.customerEmail) && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">👤 Customer Details:</p>
                        <div className="space-y-1">
                          {reservation.customerName && (
                            <p className="text-sm">
                              <span className="font-medium">Name:</span> {reservation.customerName}
                            </p>
                          )}
                          {reservation.customerPhone && (
                            <p className="text-sm">
                              <span className="font-medium">Phone:</span> {reservation.customerPhone}
                            </p>
                          )}
                          {reservation.customerEmail && (
                            <p className="text-sm">
                              <span className="font-medium">Email:</span> {reservation.customerEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payment Information Section */}
                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                      <p className="text-sm font-medium text-blue-700 mb-2">💳 Payment Information:</p>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Confirmation ID:</span>
                          <span className="font-mono text-blue-800 ml-1">{reservation._id}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Transaction ID:</span>
                          <span className="font-mono text-green-700 ml-1 bg-green-100 px-2 py-1 rounded">
                            {reservation.transactionId ? reservation.transactionId : "N/A"}
                          </span>
                          {reservation.transactionId && (
                            <button
                              onClick={() => copyToClipboard(reservation.transactionId, "Transaction ID")}
                              className="ml-2 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors"
                              title="Copy Transaction ID"
                            >
                              📋
                            </button>
                          )}
                        </p>
                        {reservation.paymentMethod && (
                          <p className="text-sm">
                            <span className="font-medium">Payment Method:</span> {reservation.paymentMethod}
                          </p>
                        )}
                        {reservation.paymentAmount && (
                          <p className="text-sm">
                            <span className="font-medium">Amount:</span> PKR {reservation.paymentAmount}
                          </p>
                        )}
                        {reservation.paymentStatus && (
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${reservation.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                              reservation.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                            Payment: {reservation.paymentStatus}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Special Requests */}
                    {reservation.specialRequests && (
                      <div className="bg-amber-50 p-3 rounded-lg mb-3">
                        <p className="text-sm font-medium text-amber-700 mb-1">📝 Special Requests:</p>
                        <p className="text-sm text-amber-800">{reservation.specialRequests}</p>
                      </div>
                    )}

                    {/* Source and Timestamps */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-3">
                      <div className="flex items-center space-x-1">
                        {reservation.source === 'chatbot' ? (
                          <MessageSquare size={14} className="text-indigo-600" />
                        ) : (
                          <Monitor size={14} className="text-gray-600" />
                        )}
                        <span>via {reservation.source || 'Web'}</span>
                      </div>
                      {reservation.createdAt && (
                        <span>
                          Booked: {new Date(reservation.createdAt).toLocaleDateString()} {new Date(reservation.createdAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col items-end space-y-3 ml-4">
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${reservation.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                        reservation.status === 'In Process' ? 'bg-yellow-100 text-yellow-800' :
                          reservation.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                      }`}>
                      {reservation.status}
                    </span>

                    <div className="flex space-x-2">
                      {reservation.status === 'Confirmed' && (
                        <button
                          onClick={() => updateStatus(reservation._id, 'In Process')}
                          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm flex items-center transition-colors"
                        >
                          <Play className="mr-1" size={14} /> Start Service
                        </button>
                      )}
                      {reservation.status === 'In Process' && (
                        <button
                          onClick={() => updateStatus(reservation._id, 'Completed')}
                          className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm flex items-center transition-colors"
                        >
                          <Check className="mr-1" size={14} /> Complete
                        </button>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex space-x-1">
                      {reservation.customerPhone && (
                        <button
                          onClick={() => window.open(`tel:${reservation.customerPhone}`)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors"
                          title="Call Customer"
                        >
                          📞
                        </button>
                      )}
                      {reservation.transactionId && (
                        <button
                          onClick={() => copyToClipboard(reservation.transactionId, "Transaction ID")}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors"
                          title="Copy Transaction ID"
                        >
                          📋
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}