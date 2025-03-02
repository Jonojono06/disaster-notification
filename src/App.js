import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import io from 'socket.io-client';

Modal.setAppElement('#root');

function App() {
  const [earthquakes, setEarthquakes] = useState([]);
  const [fires, setFires] = useState([]);
  const [activeTab, setActiveTab] = useState('earthquake');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationStatus, setNotificationStatus] = useState('default'); // Track permission state
  const ITEMS_PER_PAGE = 10;

  const BASE_URL = process.env.REACT_APP_BASE_URL || 'https://disaster-backend-tyrg.onrender.com';
  const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;
  const socket = io(BASE_URL);

  // Initial Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const eqResponse = await axios.get(`${BASE_URL}/api/disaster/earthquakes`);
        setEarthquakes(eqResponse.data);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchData();
  }, []);

  // Real-Time Updates
  useEffect(() => {
    socket.on('newEarthquakes', (newEarthquakes) => {
      setEarthquakes(prev => [...newEarthquakes, ...prev.filter(eq => !newEarthquakes.some(n => n.id === eq.id))]);
    });

    // Check initial notification permission status
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    }

    return () => {
      socket.off('newEarthquakes');
    };
  }, [socket]);

  // Enable Notifications Handler
  const enableNotifications = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window && VAPID_PUBLIC_KEY) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationStatus(permission);

        if (permission === 'granted') {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
          await axios.post(`${BASE_URL}/subscribe`, subscription);
          console.log('Subscribed to push notifications');
        } else {
          console.log('Notification permission denied');
        }
      } catch (error) {
        console.error('Failed to enable notifications:', error);
      }
    } else {
      console.log('Push notifications not supported in this browser');
    }
  };

  const openModal = (disaster) => {
    setSelectedDisaster(disaster);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDisaster(null);
  };

  const displayedDisasters = activeTab === 'earthquake' ? earthquakes : fires;
  const totalPages = Math.ceil(displayedDisasters.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDisasters = displayedDisasters.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Disaster Alerts (Earthquakes)</h1>

      <div className="flex justify-center space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'earthquake' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('earthquake')}
        >
          Earthquakes
        </button>
      </div>

      <div className="flex justify-center mb-6">
        <button
          className={`px-4 py-2 rounded ${notificationStatus === 'granted' ? 'bg-green-500' : 'bg-blue-500'} text-white`}
          onClick={enableNotifications}
          disabled={notificationStatus === 'granted' || notificationStatus === 'denied'}
        >
          {notificationStatus === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
        {paginatedDisasters.length === 0 ? (
          <p className="text-center text-gray-500">No {activeTab}s reported in the last 48 hours.</p>
        ) : (
          <>
            {paginatedDisasters.map(disaster => (
              <div key={disaster.id} className="bg-white p-4 mb-4 rounded shadow flex justify-between items-center">
                <div>
                  <p className="font-semibold">{disaster.location}</p>
                  <p className="text-sm text-gray-500">
                    {disaster.country === 'Unknown' ? 'Country: Not specified' : `Country: ${disaster.country}`}
                  </p>
                  <button
                    className="text-blue-500 underline"
                    onClick={() => openModal(disaster)}
                  >
                    View Map
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  {disaster.magnitude && <p>Magnitude: {disaster.magnitude}</p>}
                  {disaster.severity && <p>Severity: ${disaster.severity}</p>}
                  <a
                    href={`https://www.google.com/search?q=${disaster.type}+${disaster.location}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    Related Articles
                  </a>
                </div>
              </div>
            ))}
            <div className="flex justify-between mt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="bg-white p-6 rounded-lg max-w-lg mx-auto mt-20"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      >
        {selectedDisaster && (
          <>
            <h2 className="text-xl font-bold mb-4">{selectedDisaster.type} at {selectedDisaster.location}</h2>
            <iframe
              width="100%"
              height="300"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyCtpThUYDcQucKWOg_KUBQxxqUrQcyvk0U&q=${encodeURIComponent(selectedDisaster.location)}`}
              allowFullScreen
            ></iframe>
            <button
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
              onClick={closeModal}
            >
              Close
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default App;