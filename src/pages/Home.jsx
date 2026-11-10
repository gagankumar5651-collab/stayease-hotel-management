
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Hotel, Search, CalendarDays, Users,
  Wifi, Coffee, Car, Star, ArrowRight
} from "lucide-react";

import "../App.css";
import { getAllRooms } from "../services/roomService";
import { createBooking } from "../services/bookingService";
import { useAuth } from "../context/AuthContext";

function App() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");

  const [searched, setSearched] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Fetch available rooms from MongoDB
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await getAllRooms();

        const availableRooms = (data.rooms || [])
          .filter(room => room.status === "available")
          .map(room => ({
            ...room,
            name: room.roomType || "Hotel Room",
            image:
              room.image ||
              "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800"
          }));

        setRooms(availableRooms);
        setFilteredRooms(availableRooms);
      } catch (error) {
        console.error("Room fetching error:", error);
        alert(
          error.response?.data?.message ||
          "Unable to load rooms. Please try again."
        );
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, []);

  // Search rooms
  function searchRooms() {
    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    if (checkIn < today) {
      alert("Check-in date cannot be in the past.");
      return;
    }

    if (checkOut <= checkIn) {
      alert("Check-out must be after check-in.");
      return;
    }

    const results = rooms.filter(
      room => room.capacity >= Number(guests)
    );

    setFilteredRooms(results);
    setSearched(true);

    document.getElementById("rooms")?.scrollIntoView({
      behavior: "smooth"
    });
  }

  // Open booking modal
  function openBooking(room) {
    if (!user) {
      alert("Please login before booking a room.");
      navigate("/login");
      return;
    }

    if (user.role !== "customer") {
      alert("Only customers can book a room.");
      return;
    }

    if (Number(guests) > room.capacity) {
      alert(`This room can accommodate only ${room.capacity} guests.`);
      return;
    }

    setSelectedRoom(room);
    setShowBooking(true);
  }

  // Create booking in MongoDB
  async function confirmBooking() {
    if (!selectedRoom) {
      alert("Please select a room.");
      return;
    }

    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates first.");
      setShowBooking(false);
      return;
    }

    if (checkOut <= checkIn) {
      alert("Check-out must be after check-in.");
      return;
    }

    if (Number(guests) > selectedRoom.capacity) {
      alert("This room cannot accommodate the selected guests.");
      return;
    }

    try {
      setBookingLoading(true);

      const bookingData = {
        roomId: selectedRoom._id,
        checkIn,
        checkOut,
        guests: Number(guests)
      };

      const response = await createBooking(bookingData);

      alert(
        response.message || "Booking request submitted successfully!"
      );

      setShowBooking(false);
      setSelectedRoom(null);
    } catch (error) {
      console.error("Booking error:", error);

      alert(
        error.response?.data?.message ||
        "Booking failed. Please try again."
      );
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <div className="website">

      {/* Navbar */}
      <nav className="navbar">
        <h2><Hotel /> StayEase</h2>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#rooms">Rooms</a>
          <a href="#services">Services</a>
        </div>

        {user ? (
          <Link to="/my-account" className="login-btn">
            My Account
          </Link>
        ) : (
          <Link to="/login" className="login-btn">
            Login
          </Link>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content">
          <p className="tagline">WELCOME TO STAYEASE</p>

          <h1>Find Your Perfect Stay</h1>

          <p>
            Discover comfortable rooms and enjoy
            a wonderful hotel experience.
          </p>

          <div className="search-box">
            <div>
              <CalendarDays />
              <input
                type="date"
                value={checkIn}
                min={new Date().toISOString().split("T")[0]}
                onChange={e => setCheckIn(e.target.value)}
                aria-label="Check-in date"
              />
            </div>

            <div>
              <CalendarDays />
              <input
                type="date"
                value={checkOut}
                min={checkIn || new Date().toISOString().split("T")[0]}
                onChange={e => setCheckOut(e.target.value)}
                aria-label="Check-out date"
              />
            </div>

            <div>
              <Users />
              <select
                value={guests}
                onChange={e => setGuests(e.target.value)}
                aria-label="Guests"
              >
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
              </select>
            </div>

            <button onClick={searchRooms}>
              <Search /> Search
            </button>
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section className="rooms-section" id="rooms">
        <div className="section-heading">
          <p>OUR ACCOMMODATION</p>
          <h2>Explore Our Rooms</h2>

          {searched && (
            <p className="results-message">
              {filteredRooms.length} rooms match your guest requirement.
            </p>
          )}
        </div>

        <div className="room-container">

          {loadingRooms ? (
            <p>Loading rooms...</p>
          ) : filteredRooms.length > 0 ? (

            filteredRooms.map(room => (
              <div className="room-card" key={room._id}>

                <img src={room.image} alt={room.name} />

                <div className="room-details">

                  <div className="room-title">
                    <h3>
                      {room.name} - Room {room.roomNumber}
                    </h3>

                    {room.rating && (
                      <span>
                        <Star size={16} /> {room.rating}
                      </span>
                    )}
                  </div>

                  <p>
                    {room.description || "Enjoy a comfortable hotel stay."}
                  </p>

                  <div className="facilities">
                    <span><Wifi size={16} /> WiFi</span>
                    <span><Coffee size={16} /> Breakfast</span>
                    <span><Car size={16} /> Parking</span>
                  </div>

                  <div className="room-footer">
                    <h3>
                      ₹{room.pricePerNight}
                      <small> / night</small>
                    </h3>

                    <button onClick={() => openBooking(room)}>
                      Book Now <ArrowRight size={16} />
                    </button>
                  </div>

                </div>
              </div>
            ))

          ) : (
            <p>No rooms match your guest requirement.</p>
          )}

        </div>
      </section>

      {/* Footer */}
      <footer id="services">
        <h2>StayEase</h2>
        <p>Your comfort, our priority.</p>
        <p>© 2026 StayEase. All rights reserved.</p>
      </footer>

      {/* Booking Modal */}
      {showBooking && selectedRoom && (
        <div className="booking-overlay">

          <div className="booking-modal">

            <button
              className="close-btn"
              onClick={() => {
                setShowBooking(false);
                setSelectedRoom(null);
              }}
              disabled={bookingLoading}
            >
              ✕
            </button>

            <h2>Book Your Room</h2>

            <h3>
              {selectedRoom.name} - Room {selectedRoom.roomNumber}
            </h3>

            <p>₹{selectedRoom.pricePerNight} / night</p>

            <p>Check-in: {checkIn}</p>
            <p>Check-out: {checkOut}</p>
            <p>Guests: {guests}</p>
            <p>Maximum capacity: {selectedRoom.capacity} guests</p>

            <button
              onClick={confirmBooking}
              disabled={bookingLoading}
            >
              {bookingLoading ? "Booking..." : "Confirm Booking"}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export default App;
