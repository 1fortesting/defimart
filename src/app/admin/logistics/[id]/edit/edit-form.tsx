"use client"

export default function EditForm() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">Edit Product</h2>

      <form className="mt-4 space-y-4">
        <input
          type="text"
          placeholder="Product Name"
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          placeholder="Price"
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </form>
    </div>
  )
}
