import React, { useState, useEffect, useCallback } from 'react';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const DISCOVER_URL = `${BASE_URL}/discover/movie?api_key=${API_KEY}`;
const SEARCH_URL = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=`;
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w200";
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/200x300?text=No+Image";


// for a single movie card.
const MovieCard = ({ movie }) => {
    const posterPath = movie.poster_path
        ? `${IMAGE_BASE_URL}${movie.poster_path}`
        : PLACEHOLDER_IMAGE;

    return (
        <div className="moviedisplay">
            <img src={posterPath} alt={movie.title} />
            <p><strong>{movie.title}</strong></p>
            <p>Release Date: {movie.release_date || "N/A"}</p>
            <p>Rating: {movie.vote_average?.toFixed(1) || "N/A"}</p>
        </div>
    );
};

// pagination controls.
const Pagination = ({ currentPage, totalPages, onPageChange }) => (
    <div className="pagination">
        <button
            id="prevBtn"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
        >
            Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
            id="nextBtn"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
        >
            Next
        </button>
    </div>
);


// main application component.
const App = () => {
    // state variables
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('popularity.desc'); // Initial sort state

    // function to construct the API URL based on current state
    const constructUrl = useCallback(() => {
        let url;
        if (searchQuery) {
            url = `${SEARCH_URL}${encodeURIComponent(searchQuery)}`;
        } else {
            // Include sort_by only for the discover endpoint, not search
            url = `${DISCOVER_URL}&sort_by=${sortBy}`;
        }
        return url;
    }, [searchQuery, sortBy]);

    // fetch and display movies
    const fetchMovies = useCallback(async (page = 1) => {
        setLoading(true);
        setError(null);
        const url = constructUrl();

        try {
            const response = await fetch(`${url}&page=${page}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (!data.results || data.results.length === 0) {
                setMovies([]);
            } else {
                setMovies(data.results);
            }

            setCurrentPage(data.page);
            setTotalPages(data.total_pages);

        } catch (err) {
            console.error("Error fetching movies:", err);
            setError("Failed to fetch movies.");
            setMovies([]);
        } finally {
            setLoading(false);
        }
    }, [constructUrl]);

    // effect for initial load and when search parameters change
    useEffect(() => {
        fetchMovies(1);
    }, [searchQuery, sortBy, fetchMovies]);


    // handle search input
    const handleSearchChange = (event) => {
        // debouncing logic could be added here for better performance
        setSearchQuery(event.target.value.trim());
    };

    // handle sort selection change
    const handleSortChange = (event) => {
        setSortBy(event.target.value);
    };

    // handle pagination 
    const handlePageChange = (newPage) => {
        fetchMovies(newPage);
    };

   
    const renderContent = () => {
        if (loading) {
            return <p>Loading movies...</p>;
        }

        if (error) {
            return <p style={{ color: 'red' }}>Error: {error}</p>;
        }

        if (movies.length === 0) {
            return <p>No movies found.</p>;
        }

        return (
            <>
                <section id="movies" className="content">
                    {movies.map(movie => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))}
                </section>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </>
        );
    };

    return (
        <>
            <header>
                <div className="title">
                    <h1>Movie Explorer</h1>
                </div>

                <div className="controls">
                    <input
                        type="text"
                        id="search_id"
                        placeholder="Search for a movie ..."
                        // value is driven by state
                        onChange={handleSearchChange}
                    />
                    <select
                        id="sort"
                        value={sortBy} // value is driven by state
                        onChange={handleSortChange}
                        disabled={!!searchQuery}
                    >
                        <option value="" disabled>Sort</option>
                        <option value="popularity.desc">Popularity (Desc)</option>
                        <option value="release_date.asc">Release Date (Asc)</option>
                        <option value="release_date.desc">Release Date (Desc)</option>
                        <option value="vote_average.asc">Rating (Asc)</option>
                        <option value="vote_average.desc">Rating (Desc)</option>
                    </select>
                </div>
            </header>

            {renderContent()}
        </>
    );
};

export default App;