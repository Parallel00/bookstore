
process.env.NODE_ENV = "test"

const request = require("supertest");


const app = require("../app");
const db = require("../db");

let book_isbn;


beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO
      books (isbn, amazon_url,author,language,pages,publisher,title,year)
      VALUES(
        '1854638937',
        'https://amazon.com/example1',
        'Humphrey',
        'English',
        100,
        'Publishhh',
        'A normal book', 2024)
      RETURNING isbn`);

  book_isbn = result.rows[0].isbn
});


describe("POST /books", function () {
  test("Creates a new book", async function () {
    const response = await request(app)
        .post(`/books`)
        .send({
          isbn: '1100101001',
          amazon_url: "https://example.com",
          author: "Jane Doe",
          language: "english",
          pages: 613,
          publisher: "publishing publishers",
          title: "amazing times",
          year: 1997
        });
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
  });

  test("Doesn't create the book if it doesn't have the required title", async function () {
    const response = await request(app)
        .post(`/books`)
        .send({year: 2000});
    expect(response.statusCode).toBe(400);
  });
});


describe("GET /books", function () {
  test("Gets a book list", async function () {
    const response = await request(app).get(`/books`);
    const books = response.body.books;
    expect(books).toHaveLength(1);
    expect(books[0]).toHaveProperty("isbn");
    expect(books[0]).toHaveProperty("amazon_url");
  });
});


describe("GET /books/:isbn", function () {
  test("Gets a specific book", async function () {
    const response = await request(app)
        .get(`/books/${book_isbn}`)
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.isbn).toBe(book_isbn);
  });

  test("Returns 404 if it can't find the book", async function () {
    const response = await request(app)
        .get(`/books/999`)
    expect(response.statusCode).toBe(404);
  });
});


describe("PUT /books/:id", function () {
  test("Updates a specific book", async function () {
    const response = await request(app)
        .put(`/books/${book_isbn}`)
        .send({
          amazon_url: "https://taco.com",
          author: "Jane doe",
          language: "english",
          pages: 1000,
          publisher: "Book publishing company",
          title: "QWERTYUIOPASDFGHJKLZXCVBNM",
          year: 2000
        });
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.title).toBe("UPDATED BOOK");
  });

  test("Stops if it finds a bad field", async function () {
    const response = await request(app)
        .put(`/books/${book_isbn}`)
        .send({
          isbn: '1100101001',
		  invalidField: "OH HELLO THERE",
          amazon_url: "https://example.com",
          author: "Jane Doe",
          language: "english",
          pages: 613,
          publisher: "publishing publishers",
          title: "amazing times",
          year: 1997
        });
    expect(response.statusCode).toBe(400);
  });

  test("Returns 404 if it can't find the book.", async function () {
    // delete book first
    await request(app)
        .delete(`/books/${book_isbn}`)
    const response = await request(app).delete(`/books/${book_isbn}`);
    expect(response.statusCode).toBe(404);
  });
});


describe("DELETE /books/:id", function () {
  test("Deletes a specific book", async function () {
    const response = await request(app)
        .delete(`/books/${book_isbn}`)
    expect(response.body).toEqual({message: "Book has been deleted"});
  });
});


afterEach(async function () {
  await db.query("DELETE FROM BOOKS");
});


afterAll(async function () {
  await db.end()
});
