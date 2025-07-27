import React, { useState, useEffect } from "react";
import {
  MapPin,
  Camera,
  Heart,
  Trash2,
  Search,
  Calendar,
  X,
  Image as ImageIcon,
  Clock,
  Edit,
  Plus,
  Filter,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import  "../../assets/placeholder.png"

const Home = () => {
  const [stories, setStories] = useState([]);
  const [allStories, setAllStories] = useState([]); // Store all stories for filtering
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStoryId, setCurrentStoryId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    story: "",
    visitedLocation: "",
    imageUrl: "",
    visitedDate: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState({ startDate: "", endDate: "" });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userInfo, setUserInfo] = useState({
    name: "",
    fullName: "",
    email: "",
  });
  const navigate = useNavigate();

  // Fetch all stories on component mount
  useEffect(() => {
    fetchStories();
    fetchUserInfo();
  }, []);

  // Search functionality with debouncing
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim() === "") {
        setStories(allStories);
      } else if (searchQuery.trim().length >= 2) {
        handleSearch();
      }
    }, 300); // 300ms delay

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, allStories]);

  // Date filter effect
  useEffect(() => {
    if (dateFilter.startDate && dateFilter.endDate) {
      handleDateFilter();
    } else if (!dateFilter.startDate && !dateFilter.endDate) {
      setStories(allStories);
    }
  }, [dateFilter, allStories]);

  const fetchStories = async () => {
    try {
      const response = await axiosInstance.get("/get-all-stories");
      setStories(response.data.stories);
      setAllStories(response.data.stories); // Store all stories
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch stories");
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      console.log(response.data.user.fullName);
      setUserInfo({
        fullName: response.data.user.fullName || "User",
        // No need to set email since we're not using it
      });
    } catch (err) {
      console.error("Failed to fetch user info:", err);
      // Fallback to token decode or default values
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUserInfo({
            fullName: payload.fullName || "User",
          });
        } catch {
          setUserInfo({ fullName: "User" });
        }
      } else {
        setUserInfo({ fullName: "User" });
      }
    }
  };

  // Handle form input changes
  const handleInputChange = ({ target }) => {
    setFormData((prev) => ({ ...prev, [target.name]: target.value }));
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && !file.type.startsWith("image/")) {
      setError("Please select an image file");
      setImageFile(null);
      return;
    }
    setImageFile(file);
    setError(null);
  };

  // Open modal for creating or editing
  const openModal = (story = null) => {
    if (story) {
      setIsEditMode(true);
      setCurrentStoryId(story._id);
      setFormData({
        title: story.title,
        story: story.story,
        visitedLocation: story.visitedLocation.join(", "),
        imageUrl: story.imageUrl,
        visitedDate: new Date(story.visitedDate).toISOString().split("T")[0],
      });
    } else {
      setIsEditMode(false);
      setCurrentStoryId(null);
      setFormData({
        title: "",
        story: "",
        visitedLocation: "",
        imageUrl: "",
        visitedDate: "",
      });
      setImageFile(null);
    }
    setIsModalOpen(true);
    setError(null);
  };

  // Handle form submission for creating or editing story
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        const formDataImage = new FormData();
        formDataImage.append("image", imageFile);
        const imageResponse = await axiosInstance.post(
          "/image-upload",
          formDataImage,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        imageUrl = imageResponse.data.imageUrl;
      }

      const payload = {
        title: formData.title,
        story: formData.story,
        visitedLocation: formData.visitedLocation
          .split(",")
          .map((loc) => loc.trim())
          .filter((loc) => loc),
        imageUrl,
        visitedDate: new Date(formData.visitedDate).getTime(),
      };

      if (isEditMode) {
        await axiosInstance.post(`/edit-story/${currentStoryId}`, payload);
      } else {
        await axiosInstance.post("/add-travel-story", payload);
      }

      setIsModalOpen(false);
      setImageFile(null);
      fetchStories();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save story. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle story deletion
  const handleDelete = async (storyId) => {
    if (window.confirm("Are you sure you want to delete this story?")) {
      try {
        await axiosInstance.delete(`/delete-story/${storyId}`);
        fetchStories();
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete story");
      }
    }
  };

  // Handle favorite toggle
  const handleFavorite = async (storyId, isFavourite) => {
    try {
      await axiosInstance.put(`/update-is-favourite/${storyId}`, {
        isFavourite: !isFavourite,
      });
      fetchStories();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update favorite status"
      );
    }
  };

  // Handle search
  const handleSearch = async () => {
    try {
      if (!searchQuery.trim() || searchQuery.trim().length < 2) {
        setStories(allStories);
        return;
      }
      const response = await axiosInstance.get(
        `/search?query=${encodeURIComponent(searchQuery.trim())}`
      );
      setStories(response.data.stories);
    } catch (err) {
      setError(err.response?.data?.message || "Search failed");
    }
  };

  // Handle date filter
  const handleDateFilter = () => {
    if (dateFilter.startDate && dateFilter.endDate) {
      const startTime = new Date(dateFilter.startDate).getTime();
      const endTime = new Date(dateFilter.endDate).getTime();

      if (startTime > endTime) {
        setError("Start date cannot be after end date");
        return;
      }

      const filteredStories = allStories.filter((story) => {
        const storyTime = new Date(story.visitedDate).getTime();
        return storyTime >= startTime && storyTime <= endTime;
      });

      setStories(filteredStories);
      setError(null);
    } else if (!dateFilter.startDate && !dateFilter.endDate) {
      setStories(allStories);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setDateFilter({ startDate: "", endDate: "" });
    setStories(allStories);
    setShowDateFilter(false);
  };

  // Quick date filter options
  const setQuickDateFilter = (days) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    setDateFilter({
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    });
  };

  // Get user initials
  const getUserInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        new Date().getDate() === day &&
        new Date().getMonth() === currentDate.getMonth() &&
        new Date().getFullYear() === currentDate.getFullYear();

      const hasStory = stories.some((story) => {
        const storyDate = new Date(story.visitedDate);
        return (
          storyDate.getDate() === day &&
          storyDate.getMonth() === currentDate.getMonth() &&
          storyDate.getFullYear() === currentDate.getFullYear()
        );
      });

      days.push(
        <div
          key={day}
          className={`h-8 flex items-center justify-center text-xs font-medium cursor-pointer rounded-lg transition-all relative ${
            isToday
              ? "bg-blue-500 text-white shadow-sm"
              : hasStory
              ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {day}
          {hasStory && !isToday && (
            <div className="absolute top-0 right-1 w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-teal-500 italic">
              Travel Story
            </h1>
          </div>

          <div className="flex-1 max-w-md mx-8 relative">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories..."
                className="w-full pl-10 pr-16 py-2.5 bg-gray-50 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <X size={14} className="text-gray-400" />
                </button>
              )}
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded transition-colors ${
                  showDateFilter || dateFilter.startDate || dateFilter.endDate
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-400"
                }`}
                title="Date Filter"
              >
                <CalendarDays size={16} />
              </button>
            </div>

            {/* Enhanced Date Filter Dropdown */}
            {showDateFilter && (
              <div className="absolute top-16 left-0 right-0 bg-white border rounded-xl shadow-xl p-6 z-20 max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CalendarDays size={18} className="mr-2 text-blue-500" />
                    Filter by Date
                  </h3>
                  <button
                    onClick={() => setShowDateFilter(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>

                {/* Quick Filter Options */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Quick Filters
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setQuickDateFilter(7)}
                      className="px-3 py-2 text-sm bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                    >
                      Last 7 days
                    </button>
                    <button
                      onClick={() => setQuickDateFilter(30)}
                      className="px-3 py-2 text-sm bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                    >
                      Last 30 days
                    </button>
                    <button
                      onClick={() => setQuickDateFilter(90)}
                      className="px-3 py-2 text-sm bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                    >
                      Last 3 months
                    </button>
                    <button
                      onClick={() => setQuickDateFilter(365)}
                      className="px-3 py-2 text-sm bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                    >
                      Last year
                    </button>
                  </div>
                </div>

                {/* Custom Date Range */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Custom Range
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={dateFilter.startDate}
                        onChange={(e) =>
                          setDateFilter((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={dateFilter.endDate}
                        onChange={(e) =>
                          setDateFilter((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowDateFilter(false)}
                      className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setShowDateFilter(false)}
                      className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Apply Filter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced User Info Display */}
          {/* Enhanced User Info Display */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {getUserInitials(userInfo.fullName)}
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">
                  {" "}
                  {/* Changed font-semibold to font-bold */}
                  {userInfo.fullName}
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    navigate("/");
                  }}
                  className="text-xs text-gray-500 hover:text-red-600 underline transition-colors flex items-center mt-0.5"
                >
                  <LogOut size={10} className="mr-1" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Enhanced Filter Status */}
          {(searchQuery || dateFilter.startDate || dateFilter.endDate) && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 px-5 py-4 rounded-xl mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter size={16} className="text-blue-600" />
                    <span className="font-medium">Active Filters:</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    {searchQuery && (
                      <span className="bg-blue-100 px-2 py-1 rounded-md">
                        Search: "{searchQuery}"
                      </span>
                    )}
                    {dateFilter.startDate && dateFilter.endDate && (
                      <span className="bg-blue-100 px-2 py-1 rounded-md">
                        Date:{" "}
                        {new Date(dateFilter.startDate).toLocaleDateString()} -{" "}
                        {new Date(dateFilter.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    ({stories.length}{" "}
                    {stories.length === 1 ? "result" : "results"})
                  </span>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium underline transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}

          {/* Stories Grid */}
          {stories.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 mb-4">
                <Camera size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {searchQuery || dateFilter.startDate || dateFilter.endDate
                  ? "No stories found matching your criteria"
                  : "Start creating your first Travel Story!"}
              </h3>
              <p className="text-gray-500 mb-8">
                {searchQuery || dateFilter.startDate || dateFilter.endDate
                  ? "Try adjusting your search or date filters"
                  : "Click the + button to jot down your thoughts, ideas, and memories"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Story Cards */}
              {stories.map((story) => (
                <div
                  key={story._id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* Story Image */}
                  <div className="relative h-48">
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="w-full h-full object-cover"
                      onError={(e) =>
                        (e.target.src =
                          "./assets/placeholder.png")
                      }
                    />
                    <button
                      onClick={() =>
                        handleFavorite(story._id, story.isFavourite)
                      }
                      className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                    >
                      <Heart
                        size={16}
                        className={
                          story.isFavourite
                            ? "text-red-500 fill-current"
                            : "text-gray-600"
                        }
                      />
                    </button>
                  </div>

                  {/* Story Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {story.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                      {new Date(story.visitedDate).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                      {story.story}
                    </p>

                    {/* Location */}
                    <div className="flex items-center text-teal-600 bg-teal-50 px-3 py-1 rounded-full text-sm w-fit mb-4">
                      <MapPin size={12} className="mr-1" />
                      <span className="truncate">
                        {story.visitedLocation.join(", ")}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => openModal(story)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(story._id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calendar Sidebar */}
        <div className="w-90 p-6">
          {/* Calendar Card */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 h-fit max-h-[400px]">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {monthNames[currentDate.getMonth()]}{" "}
                  {currentDate.getFullYear()}
                </h3>
                <div className="flex space-x-1">
                  <button
                    onClick={previousMonth}
                    className="p-1.5 hover:bg-white/20 rounded transition-colors"
                  >
                    <ChevronLeft size={16} className="text-white" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 hover:bg-white/20 rounded transition-colors"
                  >
                    <ChevronRight size={16} className="text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Body */}
            <div className="p-4 flex-1 overflow-hidden">
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="h-6 flex items-center justify-center text-xs font-semibold text-gray-600 bg-gray-50 rounded"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1 h-48 overflow-hidden">
                {renderCalendar()}
              </div>
            </div>

            {/* Calendar Footer */}
            <div className="px-4 pb-4 flex-shrink-0">
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Today</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                      <span>Stories</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {
                    stories.filter((story) => {
                      const storyDate = new Date(story.visitedDate);
                      return (
                        storyDate.getMonth() === currentDate.getMonth() &&
                        storyDate.getFullYear() === currentDate.getFullYear()
                      );
                    }).length
                  }{" "}
                  stories this month
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => openModal()}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center transform hover:scale-105"
      >
        <Plus size={24} />
      </button>

      {/* Modal for Create/Edit Story */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? "Edit Story" : "Add Story"}
              </h2>
              <div className="flex items-center space-x-4">
                <button className="text-teal-500 hover:text-teal-600 font-medium text-sm flex items-center space-x-1">
                  <Plus size={16} />
                  <span>{isEditMode ? "UPDATE STORY" : "ADD STORY"}</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  TITLE
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full text-2xl font-semibold text-gray-900 border-0 outline-none resize-none bg-transparent"
                  placeholder="Adventure in Amazon Rainforest"
                  required
                />
              </div>

              {/* Date */}
              <div className="flex items-center space-x-2 text-blue-500">
                <Calendar size={16} />
                <input
                  type="date"
                  name="visitedDate"
                  value={formData.visitedDate}
                  onChange={handleInputChange}
                  className="text-blue-500 border-0 outline-none bg-transparent"
                  required
                />
              </div>

              {/* Image Upload */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg text-center overflow-hidden">
                {formData.imageUrl || imageFile ? (
                  <div className="relative group">
                    <img
                      src={
                        imageFile
                          ? URL.createObjectURL(imageFile)
                          : formData.imageUrl
                      }
                      alt="Preview"
                      className="w-full h-64 object-cover"
                      onError={(e) =>
                        (e.target.src =
                          "./assets/placeholder.png")
                      }
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, imageUrl: "" }));
                          setImageFile(null);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="imageUpload"
                      />
                      <label
                        htmlFor="imageUpload"
                        className="inline-block w-full px-4 py-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg cursor-pointer transition-colors text-center font-medium"
                      >
                        Replace Image
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="p-12">
                    <ImageIcon
                      size={48}
                      className="mx-auto text-gray-300 mb-4"
                    />
                    <p className="text-gray-500 mb-4">
                      Browse image files to upload
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="imageUpload"
                    />
                    <label
                      htmlFor="imageUpload"
                      className="inline-block px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg cursor-pointer transition-colors font-medium"
                    >
                      Choose File
                    </label>
                  </div>
                )}
              </div>

              {/* Story Content */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  STORY
                </label>
                <textarea
                  name="story"
                  value={formData.story}
                  onChange={handleInputChange}
                  className="w-full text-gray-700 border-0 outline-none resize-none bg-transparent min-h-[120px]"
                  placeholder="Your Story"
                  required
                />
              </div>

              {/* Locations */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  LOCATIONS VISITED
                </label>
                <input
                  type="text"
                  name="visitedLocation"
                  value={formData.visitedLocation}
                  onChange={handleInputChange}
                  className="w-full text-gray-700 border-0 outline-none bg-transparent"
                  placeholder="Amazon Rainforest, Brazil"
                  required
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
              >
                {isLoading
                  ? "Saving..."
                  : isEditMode
                  ? "Update Story"
                  : "Add Story"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
