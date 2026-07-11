# Inventory Management System — API Documentation

**Base URL:** `http://localhost:{PORT}` (default port: `3000`)

**Content-Type:** `application/json`

---

## Table of Contents

- [Categories](#categories)
  - [GET /categories](#get-categories)
  - [GET /categories/:id](#get-categoriesid)
  - [POST /categories](#post-categories)
  - [PUT /categories/:id](#put-categoriesid)
  - [DELETE /categories/:id](#delete-categoriesid)
- [Parts](#parts)
  - [GET /parts](#get-parts)
  - [GET /parts/search](#get-partssearch)
  - [GET /parts/:id](#get-partsid)
  - [POST /parts](#post-parts)
  - [PUT /parts/:id](#put-partsid)
  - [DELETE /parts/:id](#delete-partsid)
- [Stock Movements](#stock-movements)
  - [GET /stock_movements](#get-stock_movements)
  - [GET /stock_movements/:id](#get-stock_movementsid)
  - [POST /stock_movements/in](#post-stock_movementsin)
  - [POST /stock_movements/out](#post-stock_movementsout)
- [Error Handling](#error-handling)

---

## Categories

Manage part categories. Each category has a unique `name` and an optional `description`.

---

### GET /categories

Retrieves all categories.

**Response**

| Status | Description |
|--------|-------------|
| `200 OK` | Array of category objects |
| `500 Internal Server Error` | Database or server failure |

**Example Response** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Electronics",
    "description": "Electronic components and devices"
  },
  {
    "id": 2,
    "name": "Fasteners",
    "description": "Bolts, nuts, screws, and washers"
  }
]
```

---

### GET /categories/:id

Retrieves a single category by its ID.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | The category ID |

**Response**

| Status | Description |
|--------|-------------|
| `200 OK` | The category object |
| `400 Bad Request` | Invalid (non-integer) category ID |
| `404 Not Found` | No category exists with the given ID |
| `500 Internal Server Error` | Database or server failure |

**Example Response** `200 OK`

```json
{
  "id": 1,
  "name": "Electronics",
  "description": "Electronic components and devices"
}
```

**Example Response** `400 Bad Request`

```json
{
  "message": "invalid category id"
}
```

---

### POST /categories

Creates a new category.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Category name (must be unique, trimmed) |
| `description` | string | No | Category description |

**Example Request**

```json
{
  "name": "Electronics",
  "description": "Electronic components and devices"
}
```

**Response**

| Status | Description |
|--------|-------------|
| `201 Created` | The newly created category object |
| `400 Bad Request` | Missing or empty category name |
| `409 Conflict` | A category with this name already exists |
| `500 Internal Server Error` | Database or server failure |

**Example Response** `201 Created`

```json
{
  "id": 1,
  "name": "Electronics",
  "description": "Electronic components and devices"
}
```

**Example Response** `409 Conflict`

```json
{
  "message": "Category already exists."
}
```

---

### PUT /categories/:id

Updates an existing category. Supports **partial updates** — unspecified fields retain their current values.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | The category ID |

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | New category name (must be non-empty if provided) |
| `description` | string | No | New category description |

**Example Request**

```json
{
  "description": "Updated description for electronics"
}
```

**Response**

| Status | Description |
|--------|-------------|
| `200 OK` | The updated category object |
| `400 Bad Request` | Invalid category ID, or name would become empty |
| `404 Not Found` | No category exists with the given ID |
| `500 Internal Server Error` | Database or server failure |

**Example Response** `200 OK`

```json
{
  "id": 1,
  "name": "Electronics",
  "description": "Updated description for electronics"
}
```

---

### DELETE /categories/:id

Deletes a category by ID. Returns the deleted category object.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | The category ID |

**Response**

| Status | Description |
|--------|-------------|
| `200 OK` | The deleted category object |
| `400 Bad Request` | Invalid (non-integer) category ID |
| `404 Not Found` | No category exists with the given ID |
| `500 Internal Server Error` | Database or server failure |

**Example Response** `200 OK`

```json
{
  "id": 1,
  "name": "Electronics",
  "description": "Electronic components and devices"
}
```

---

## Parts

Manage inventory parts. Each part belongs to a category and tracks quantity and unit price.

---

### GET /parts

Retrieves all parts.

**Response**

| Status | Description |
|--------|-------------|
| `200 OK` | Array of part objects |
| `500 Internal Server Error` | Database or server failure |

**Example Response** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Resistor 10k",
    "description": "10k Ohm resistor",
    "category_id": 1,
    "quantity": 500,
    "unit_price": "0.05",
    "created_at": "2026-07-08T12:00:00.000Z",
    "updated_at": "2026-07-08T12:00:00.000Z"
  }
]
```

---

### GET /parts/search

Searches for parts by name prefix. Optionally filters by category name.

> **Note:** This route is defined **before** `/parts/:id`, so `/parts/search` is matched correctly and not treated as an `:id` parameter.

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search term — matches parts whose name starts with this value (case-insensitive) |
| `category` | string | No | Filter results to parts in this category (exact match on category name) |

**Example Request**

```
GET /parts/search?q=resist&category=Electronics
```

**Response**

| Status | Description |
|--------|-------------|
| `200 OK` | Array of matching part objects (includes joined `category` name) |
| `400 Bad Request` | Missing or empty search term `q` |
| `500 Internal Server Error` | Database or server failure |

**Example Response** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Resistor 10k",
    "description": "10k Ohm resistor",
    "quantity": 500,
    "unit_price": "0.05",
    "created_at": "2026-07-08T12:00:00.000Z",
    "updated_at": "2026-07-08T12:00:00.000Z",
    "category_id": 1,
    "category": "Electronics"
  }
]
```

**Example Response** `400 Bad Request`

```json
{
  "message": "Search term is required."
}
```

---

### GET /parts/:id

Retrieves a single part by its ID.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | The part ID |

**Response**

| Status | Description |
|--------|-------------|
| `200 OK` | The part object |
| `400 Bad Request` | Invalid (non-integer) part ID |
| `404 Not Found` | No part exists with the given ID |
| `500 Internal Server Error` | Database or server failure |

**Example Response** `200 OK`

```json
{
  "id": 1,
  "name": "Resistor 10k",
  "description": "10k Ohm resistor",
  "category_id": 1,
  "quantity": 500,
  "unit_price": "0.05",
  "created_at": "2026-07-08T12:00:00.000Z",
  "updated_at": "2026-07-08T12:00:00.000Z"
}
```

---

### POST /parts

Creates a new part. The category is referenced **by name**, and the server resolves it to the corresponding `category_id`.

**Request Body**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | Yes | — | Part name (must be unique) |
| `description` | string | No | — | Part description |
| `category` | string | Yes | — | Category name (must match an existing category) |
| `quantity` | integer | No | `0` | Initial stock quantity |
| `unit_price` | number | Yes | — | Price per unit |

**Example Request**

```json
{
  "name": "Resistor 10k",
  "description": "10k Ohm resistor",
  "category": "Electronics",
  "quantity": 500,
  "unit_price": 0.05
}
```

**Response**

| Status | Description |
|--------|-------------|
| `201 Created` | The newly created part object |
| `409 Conflict` | A part with this name already exists |
| `500 Internal Server Error` | Database or server failure (e.g., referenced category doesn't exist) |

**Example Response** `201 Created`

```json
{
  "id": 1,
  "name": "Resistor 10k",
  "description": "10k Ohm resistor",
  "category_id": 1,
  "quantity": 500,
  "unit_price": "0.05",
  "created_at": "2026-07-08T12:00:00.000Z",
  "updated_at": "2026-07-08T12:00:00.000Z"
}
```

---

### PUT /parts/:id

Updates an existing part. Supports **partial updates** — unspecified fields retain their current values. The `category` field can be supplied as a category **name** string; the server resolves it to the correct `category_id`. Also updates the `updated_at` timestamp.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | The part ID |

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | New part name (must be non-empty if provided) |
| `description` | string | No | New part description |
| `category` | string | No | Category name to reassign the part to |
| `category_id` | integer | No | Category ID to reassign the part to (used if `category` is not provided) |
| `quantity` | integer | No | New stock quantity |
| `unit_price` | number | No | New unit price |

**Example Request**

```json
{
  "unit_price": 0.06,
  "category": "Passive Components"
}
```

**Response**

| Status | Description |
|--------|-------------|
| `200 OK` | The updated part object |
| `400 Bad Request` | Invalid part ID, or name would become empty |
| `404 Not Found` | Part not found, or specified category name doesn't exist |
| `409 Conflict` | A part with the new name already exists |
| `500 Internal Server Error` | Database or server failure |

**Example Response** `200 OK`

```json
{
  "id": 1,
  "name": "Resistor 10k",
  "description": "10k Ohm resistor",
  "category_id": 3,
  "quantity": 500,
  "unit_price": "0.06",
  "created_at": "2026-07-08T12:00:00.000Z",
  "updated_at": "2026-07-09T01:00:00.000Z"
}
```

---

### DELETE /parts/:id

Deletes a part by ID. Returns the deleted part object. **Fails** if the part has associated stock movement history (foreign key constraint).

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | The part ID |

**Response**

| Status | Description |
|--------|-------------|
| `200 OK` | The deleted part object |
| `400 Bad Request` | Invalid (non-integer) part ID |
| `404 Not Found` | No part exists with the given ID |
| `409 Conflict` | Part has stock movement history and cannot be deleted |
| `500 Internal Server Error` | Database or server failure |

**Example Response** `409 Conflict`

```json
{
  "message": "Cannot delete a part that has stock movement history."
}
```

---

## Stock Movements

Track inventory changes. Each movement records stock coming **in** or going **out** for a specific part. Stock-in and stock-out operations run inside a **database transaction** to ensure the part's `quantity` is updated atomically.

---

### GET /stock_movements

Retrieves all stock movement records.

**Response**

| Status | Description |
|--------|-------------|
| `200 OK` | Array of stock movement objects |
| `500 Internal Server Error` | Database or server failure |

**Example Response** `200 OK`

```json
[
  {
    "id": 1,
    "movement_type": "IN",
    "part_id": 1,
    "quantity": 200,
    "reason": "Restocking from supplier"
  },
  {
    "id": 2,
    "movement_type": "OUT",
    "part_id": 1,
    "quantity": 50,
    "reason": "Shipped to customer"
  }
]
```

---

### GET /stock_movements/:id

Retrieves all stock movement records for a specific **part**.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | The **part** ID to look up movements for |

**Response**

| Status | Description |
|--------|-------------|
| `200 OK` | Array of stock movement objects for the given part |
| `400 Bad Request` | Invalid (non-integer) part ID |
| `404 Not Found` | No stock movements found for this part |
| `500 Internal Server Error` | Database or server failure |

**Example Response** `200 OK`

```json
[
  {
    "id": 1,
    "movement_type": "IN",
    "part_id": 1,
    "quantity": 200,
    "reason": "Restocking from supplier"
  }
]
```

---

### POST /stock_movements/in

Records a **stock-in** event. Adds the specified quantity to the part's current stock within a database transaction.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `part_id` | integer | Yes | The ID of the part receiving stock |
| `quantity` | integer | Yes | Amount to add to inventory |
| `reason` | string | No | Reason for the stock-in |

**Example Request**

```json
{
  "part_id": 1,
  "quantity": 200,
  "reason": "Restocking from supplier"
}
```

**Response**

| Status | Description |
|--------|-------------|
| `201 Created` | The created stock movement record |
| `500 Internal Server Error` | Database or server failure (transaction rolled back) |

**Example Response** `201 Created`

```json
{
  "id": 3,
  "movement_type": "IN",
  "part_id": 1,
  "quantity": 200,
  "reason": "Restocking from supplier"
}
```

---

### POST /stock_movements/out

Records a **stock-out** event. Subtracts the specified quantity from the part's current stock within a database transaction. The operation is rejected if the resulting quantity would be negative (database `CHECK` constraint).

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `part_id` | integer | Yes | The ID of the part being depleted |
| `quantity` | integer | Yes | Amount to remove from inventory |
| `reason` | string | No | Reason for the stock-out |

**Example Request**

```json
{
  "part_id": 1,
  "quantity": 50,
  "reason": "Shipped to customer"
}
```

**Response**

| Status | Description |
|--------|-------------|
| `201 Created` | The created stock movement record |
| `400 Bad Request` | Insufficient inventory stock, or part doesn't exist |
| `500 Internal Server Error` | Database or server failure (transaction rolled back) |

**Example Response** `201 Created`

```json
{
  "id": 4,
  "movement_type": "OUT",
  "part_id": 1,
  "quantity": 50,
  "reason": "Shipped to customer"
}
```

**Example Response** `400 Bad Request` (insufficient stock)

```json
{
  "message": "Insufficient inventory stock."
}
```

**Example Response** `400 Bad Request` (part doesn't exist)

```json
{
  "message": "Part doesn't exist"
}
```

---

## Error Handling

All endpoints return errors in a consistent JSON format:

```json
{
  "message": "Human-readable error description"
}
```

### Common Error Codes

| Status Code | Meaning | When it occurs |
|-------------|---------|----------------|
| `400` | Bad Request | Invalid ID format, missing required fields, insufficient stock |
| `404` | Not Found | Resource with the given ID doesn't exist |
| `409` | Conflict | Unique constraint violation (duplicate name), or foreign key prevents deletion |
| `500` | Internal Server Error | Unhandled database or server errors |

### PostgreSQL Error Code Mapping

The API translates specific PostgreSQL error codes into user-friendly responses:

| PG Error Code | HTTP Status | Context |
|---------------|-------------|---------|
| `23505` (unique_violation) | `409 Conflict` | Duplicate category name or part name |
| `23503` (foreign_key_violation) | `409 Conflict` / `400 Bad Request` | Deleting a part with stock history, or referencing a non-existent part |
| `23514` (check_violation) | `400 Bad Request` | Stock-out would result in negative quantity |
