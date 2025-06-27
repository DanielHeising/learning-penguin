import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import './Calendar.css';

function Calendar() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch events when component mounts
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events`);
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const handleEventClick = (info) => {
    setSelectedEvent(info.event);
    setShowModal(true);
  };

  const handleDateSelect = (selectInfo) => {
    setSelectedEvent({
      start: selectInfo.start,
      end: selectInfo.end,
      allDay: selectInfo.allDay
    });
    setShowModal(true);
  };

  const handleEventDrop = async (info) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${info.event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: info.event.start,
          end: info.event.end,
          allDay: info.event.allDay
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update event');
      }
      
      // Refresh events after successful update
      fetchEvents();
    } catch (err) {
      console.error('Error updating event:', err);
      info.revert();
    }
  };

  const handleEventSave = async (eventData) => {
    try {
      const method = eventData.id ? 'PUT' : 'POST';
      const url = eventData.id 
        ? `${import.meta.env.VITE_API_URL}/events/${eventData.id}`
        : `${import.meta.env.VITE_API_URL}/events`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error('Failed to save event');
      }

      setShowModal(false);
      fetchEvents();
    } catch (err) {
      console.error('Error saving event:', err);
    }
  };

  const handleEventDelete = async (eventId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      setShowModal(false);
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={events}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        height="auto"
      />
      
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{selectedEvent.id ? 'Edit Event' : 'New Event'}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleEventSave({
                id: selectedEvent.id,
                title: formData.get('title'),
                description: formData.get('description'),
                start: selectedEvent.start,
                end: selectedEvent.end,
                allDay: selectedEvent.allDay,
                color: formData.get('color')
              });
            }}>
              <div>
                <label htmlFor="title">Title:</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  defaultValue={selectedEvent.title}
                  required
                />
              </div>
              <div>
                <label htmlFor="description">Description:</label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={selectedEvent.description}
                />
              </div>
              <div>
                <label htmlFor="color">Color:</label>
                <input
                  type="color"
                  id="color"
                  name="color"
                  defaultValue={selectedEvent.color || '#3788d8'}
                />
              </div>
              <div className="modal-buttons">
                <button type="submit">Save</button>
                {selectedEvent.id && (
                  <button
                    type="button"
                    onClick={() => handleEventDelete(selectedEvent.id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                )}
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar; 