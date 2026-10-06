// ==========================================
// Current Quote
// ==========================================

let currentQuote = {
    text: "",
    author: ""
};


// ==========================================
// HTML Elements
// ==========================================

const quoteText =
    document.getElementById("quote-text");

const quoteAuthor =
    document.getElementById("quote-author");

const source =
    document.getElementById("source");

const message =
    document.getElementById("message");

const newQuoteBtn =
    document.getElementById("new-quote-btn");

const favoriteBtn =
    document.getElementById("favorite-btn");

const copyBtn =
    document.getElementById("copy-btn");

const refreshBtn =
    document.getElementById("refresh-btn");

const favoritesList =
    document.getElementById("favorites-list");


// ==========================================
// SHOW MESSAGE
// ==========================================

function showMessage(text) {

    message.textContent = text;

    setTimeout(() => {
        message.textContent = "";
    }, 3000);

}


// ==========================================
// GET QUOTE
// ==========================================

async function getRandomQuote() {

    quoteText.textContent =
        "Loading quote...";

    quoteAuthor.textContent = "";

    source.textContent = "";

    try {

        const response =
            await fetch("/api/quote");

        if (!response.ok) {
            throw new Error(
                "Quote request failed"
            );
        }

        const data =
            await response.json();

        console.log(
            "Quote response:",
            data
        );


        currentQuote.text =
            data.quote.text;

        currentQuote.author =
            data.quote.author;


        quoteText.textContent =
            `"${currentQuote.text}"`;

        quoteAuthor.textContent =
            `— ${currentQuote.author}`;


        if (data.source === "external") {

            source.textContent =
                "Source: External API";

        } else {

            source.textContent =
                "Source: Backend fallback";

        }

    } catch (error) {

        console.error(
            "Quote error:",
            error
        );

        quoteText.textContent =
            "Unable to load quote.";

    }

}


// ==========================================
// SAVE FAVORITE
// ==========================================

async function saveFavorite() {

    console.log(
        "Favorite button clicked"
    );

    console.log(
        "Current quote:",
        currentQuote
    );


    if (
        !currentQuote.text ||
        !currentQuote.author
    ) {

        showMessage(
            "Please wait for a quote to load."
        );

        return;
    }


    try {

        const response =
            await fetch(
                "/api/favorites",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        quote:
                            currentQuote.text,

                        author:
                            currentQuote.author
                    })
                }
            );


        const data =
            await response.json();


        console.log(
            "Save response:",
            data
        );


        if (response.status === 409) {

            showMessage(
                "❤️ This quote is already saved."
            );

            return;
        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to save quote"
            );

        }


        showMessage(
            "❤️ Quote saved successfully!"
        );


        // Immediately reload favorites

        await loadFavorites();

    } catch (error) {

        console.error(
            "Save favorite error:",
            error
        );

        showMessage(
            "❌ Failed to save favorite."
        );

    }

}


// ==========================================
// LOAD FAVORITES
// ==========================================

async function loadFavorites() {

    console.log(
        "Loading favorites..."
    );


    try {

        const response =
            await fetch(
                "/api/favorites"
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load favorites"
            );

        }


        const data =
            await response.json();


        console.log(
            "Favorites:",
            data
        );


        favoritesList.innerHTML = "";


        if (
            !data.favorites ||
            data.favorites.length === 0
        ) {

            favoritesList.innerHTML = `
                <p class="empty">
                    No favorite quotes yet.
                </p>
            `;

            return;
        }


        data.favorites.forEach(
            (favorite) => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "favorite-card";


                // Quote

                const quote =
                    document.createElement(
                        "p"
                    );

                quote.className =
                    "favorite-quote";

                quote.textContent =
                    `"${favorite.quote}"`;


                // Author

                const author =
                    document.createElement(
                        "p"
                    );

                author.className =
                    "favorite-author";

                author.textContent =
                    `— ${favorite.author}`;


                // Date

                const date =
                    document.createElement(
                        "p"
                    );

                date.className =
                    "favorite-date";

                date.textContent =
                    `Saved: ${new Date(
                        favorite.created_at
                    ).toLocaleString()}`;


                // Actions

                const actions =
                    document.createElement(
                        "div"
                    );

                actions.className =
                    "favorite-actions";


                // Copy button

                const copyButton =
                    document.createElement(
                        "button"
                    );

                copyButton.className =
                    "copy-favorite";

                copyButton.textContent =
                    "📋 Copy";


                copyButton.addEventListener(
                    "click",
                    function () {

                        copyQuote(
                            favorite.quote,
                            favorite.author
                        );

                    }
                );


                // Delete button

                const deleteButton =
                    document.createElement(
                        "button"
                    );

                deleteButton.className =
                    "delete-favorite";

                deleteButton.textContent =
                    "🗑 Delete";


                deleteButton.addEventListener(
                    "click",
                    function () {

                        deleteFavorite(
                            favorite.id
                        );

                    }
                );


                actions.appendChild(
                    copyButton
                );

                actions.appendChild(
                    deleteButton
                );


                card.appendChild(
                    quote
                );

                card.appendChild(
                    author
                );

                card.appendChild(
                    date
                );

                card.appendChild(
                    actions
                );


                favoritesList.appendChild(
                    card
                );

            }
        );

    } catch (error) {

        console.error(
            "Load favorites error:",
            error
        );

        favoritesList.innerHTML = `
            <p class="empty">
                Failed to load favorites.
            </p>
        `;

    }

}


// ==========================================
// COPY QUOTE
// ==========================================

async function copyQuote(
    quote,
    author
) {

    const text =
        `"${quote}" — ${author}`;


    // Modern clipboard

    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                text
            );

            showMessage(
                "📋 Quote copied!"
            );

            return;

        }

    } catch (error) {

        console.log(
            "Clipboard API failed. Trying fallback."
        );

    }


    // Fallback clipboard method

    try {

        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value = text;

        textarea.style.position =
            "fixed";

        textarea.style.left =
            "-9999px";

        document.body.appendChild(
            textarea
        );

        textarea.focus();

        textarea.select();

        const successful =
            document.execCommand(
                "copy"
            );

        document.body.removeChild(
            textarea
        );


        if (successful) {

            showMessage(
                "📋 Quote copied!"
            );

        } else {

            showMessage(
                "❌ Copy failed."
            );

        }

    } catch (error) {

        console.error(
            "Copy error:",
            error
        );

        showMessage(
            "❌ Copy failed."
        );

    }

}


// ==========================================
// DELETE FAVORITE
// ==========================================

async function deleteFavorite(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this quote?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/favorites/${id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        console.log(
            "Delete response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message
            );

        }


        showMessage(
            "🗑 Favorite deleted."
        );


        await loadFavorites();

    } catch (error) {

        console.error(
            "Delete error:",
            error
        );

        showMessage(
            "❌ Failed to delete."
        );

    }

}


// ==========================================
// BUTTON EVENTS
// ==========================================

newQuoteBtn.addEventListener(
    "click",
    getRandomQuote
);


favoriteBtn.addEventListener(
    "click",
    saveFavorite
);


copyBtn.addEventListener(
    "click",
    function () {

        if (!currentQuote.text) {

            showMessage(
                "No quote available."
            );

            return;
        }


        copyQuote(
            currentQuote.text,
            currentQuote.author
        );

    }
);


refreshBtn.addEventListener(
    "click",
    loadFavorites
);


// ==========================================
// INITIAL LOAD
// ==========================================

getRandomQuote();

loadFavorites();