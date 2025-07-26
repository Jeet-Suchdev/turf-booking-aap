import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Navbar, Nav, Container, Button, Modal } from "react-bootstrap";
import Logo from "../assets/download-cropped-cropped.svg"; // <-- Add your SVG here

const AppNavbar = () => {
  const { isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleLogoutConfirm = () => {
    logout();
    setShowModal(false);
    navigate("/");
  };

  return (
    <>
      <Navbar bg="light" variant="light" expand="lg">
        <Container>
          <Navbar.Brand
            as={Link}
            to="/"
            className="d-flex align-items-center"
            style={{ color: "#2a9d8f" }}
          >
            {/* SVG Logo */}
            <img
              src={Logo}
              alt="TurfTown Logo"
              style={{ height: "40px", marginRight: "8px" }} // Adjust size here
            />
            TurfTown
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              {/* Home button - always visible */}
              <Nav.Link as={Link} to="/" className="me-2">
                Home
              </Nav.Link>

              {isAuthenticated ? (
                <>
                  {!isAdmin && (
                    <Nav.Link as={Link} to="/my-bookings">
                      My Bookings
                    </Nav.Link>
                  )}

                  {isAdmin && (
                    <Nav.Link as={Link} to="/admin/dashboard">
                      Admin Dashboard
                    </Nav.Link>
                  )}

                  <Button
                    variant="outline-danger"
                    onClick={() => setShowModal(true)}
                    className="ms-3"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Logout Confirmation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to logout?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleLogoutConfirm}>
            Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AppNavbar;
