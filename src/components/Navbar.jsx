import React, { useState } from "react";
// Import NavLink to handle active link styling
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Navbar, Nav, Container, Button, Modal } from "react-bootstrap";
import Logo from "../assets/download-cropped-cropped.svg";

const AppNavbar = () => {
  const { isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleLogoutConfirm = () => {
    logout();
    setShowModal(false);
    navigate("/");
  };

  const handleLogoutClick = () => {
    setExpanded(false);
    setShowModal(true);
  };

  // Style objects for NavLinks
  const navLinkStyle = {
    fontWeight: "500",
    color: "#495057",
    margin: "0 0.5rem",
  };

  const activeLinkStyle = {
    color: "#2a9d8f",
    fontWeight: "700",
  };

  return (
    <>
      <Navbar
        // Changed to white, added shadow and sticky top
        bg="white"
        expand="lg"
        className="shadow-sm"
        sticky="top"
        expanded={expanded}
        onToggle={() => setExpanded((prevExpanded) => !prevExpanded)}
      >
        <Container>
          <Navbar.Brand
            as={Link}
            to="/"
            className="d-flex align-items-center"
            style={{ color: "#2a9d8f", fontWeight: "bold" }}
            onClick={() => setExpanded(false)}
          >
            <img
              src={Logo}
              alt="TurfTown Logo"
              style={{ height: "40px", marginRight: "10px" }}
            />
            TurfTown
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="py-3 py-lg-0">
            <Nav className="ms-auto align-items-center text-center">
              {/* Using NavLink for active styling */}
              <Nav.Link
                as={NavLink}
                to="/"
                onClick={() => setExpanded(false)}
                style={({ isActive }) =>
                  isActive
                    ? { ...navLinkStyle, ...activeLinkStyle }
                    : navLinkStyle
                }
              >
                Home
              </Nav.Link>

              {isAuthenticated ? (
                <>
                  {!isAdmin && (
                    <Nav.Link
                      as={NavLink}
                      to="/my-bookings"
                      onClick={() => setExpanded(false)}
                      style={({ isActive }) =>
                        isActive
                          ? { ...navLinkStyle, ...activeLinkStyle }
                          : navLinkStyle
                      }
                    >
                      My Bookings
                    </Nav.Link>
                  )}

                  {isAdmin && (
                    <Nav.Link
                      as={NavLink}
                      // Reverted this link as requested
                      to="/admin/dashboard"
                      onClick={() => setExpanded(false)}
                      style={({ isActive }) =>
                        isActive
                          ? { ...navLinkStyle, ...activeLinkStyle }
                          : navLinkStyle
                      }
                    >
                      Admin Dashboard
                    </Nav.Link>
                  )}

                  <Button
                    variant="outline-danger"
                    onClick={handleLogoutClick}
                    className="ms-lg-3 mt-3 mt-lg-0"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                // Changed Login to a more prominent button
                <Button
                  as={Link}
                  to="/login"
                  onClick={() => setExpanded(false)}
                  className="ms-lg-3 mt-3 mt-lg-0"
                  style={{ backgroundColor: "#2a9d8f", borderColor: "#2a9d8f" }}
                >
                  Login
                </Button>
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
