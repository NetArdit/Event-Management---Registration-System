import { useState } from 'react'
import { EVENT_STATUSES, STATUS_LABELS } from '../utils/eventHelpers'
import './EventForm.css'

const EMPTY_FORM = {
  title: '',
  description: '',
  event_date: '',
  start_time: '',
  end_time: '',
  location: '',
  category: '',
  capacity: '',
  image_url: '',
  status: 'upcoming',
}

export default function EventForm({ initialValues, onSubmit, submitting, submitLabel = 'Save Event' }) {
  const [form, setForm] = useState(() => {
    const merged = { ...EMPTY_FORM }
    Object.keys(EMPTY_FORM).forEach((key) => {
      if (initialValues?.[key] !== null && initialValues?.[key] !== undefined) {
        merged[key] = initialValues[key]
      }
    })
    return merged
  })
  const [errors, setErrors] = useState({})

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function validate() {
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Title is required.'
    if (!form.description.trim()) nextErrors.description = 'Description is required.'
    if (!form.event_date) nextErrors.event_date = 'Date is required.'
    if (!form.start_time) nextErrors.start_time = 'Start time is required.'
    if (!form.end_time) nextErrors.end_time = 'End time is required.'
    if (form.start_time && form.end_time && form.end_time <= form.start_time) {
      nextErrors.end_time = 'End time must be after start time.'
    }
    if (!form.location.trim()) nextErrors.location = 'Location is required.'
    if (!form.category.trim()) nextErrors.category = 'Category is required.'
    const capacityNumber = Number(form.capacity)
    if (!form.capacity || !Number.isInteger(capacityNumber) || capacityNumber <= 0) {
      nextErrors.capacity = 'Capacity must be a whole number greater than 0.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return
    onSubmit({ ...form, capacity: Number(form.capacity) })
  }

  return (
    <form className="event-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input id="title" name="title" value={form.title} onChange={handleChange} />
        {errors.title && <p className="field-error">{errors.title}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" value={form.description} onChange={handleChange} />
        {errors.description && <p className="field-error">{errors.description}</p>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="event_date">Date</label>
          <input
            id="event_date"
            name="event_date"
            type="date"
            value={form.event_date}
            onChange={handleChange}
          />
          {errors.event_date && <p className="field-error">{errors.event_date}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input
            id="category"
            name="category"
            placeholder="e.g. Workshop, Lecture, Career"
            value={form.category}
            onChange={handleChange}
          />
          {errors.category && <p className="field-error">{errors.category}</p>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="start_time">Start time</label>
          <input id="start_time" name="start_time" type="time" value={form.start_time} onChange={handleChange} />
          {errors.start_time && <p className="field-error">{errors.start_time}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="end_time">End time</label>
          <input id="end_time" name="end_time" type="time" value={form.end_time} onChange={handleChange} />
          {errors.end_time && <p className="field-error">{errors.end_time}</p>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="location">Location</label>
        <input id="location" name="location" value={form.location} onChange={handleChange} />
        {errors.location && <p className="field-error">{errors.location}</p>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="capacity">Capacity</label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min="1"
            step="1"
            value={form.capacity}
            onChange={handleChange}
          />
          {errors.capacity && <p className="field-error">{errors.capacity}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={form.status} onChange={handleChange}>
            {EVENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="image_url">Image URL (optional)</label>
        <input
          id="image_url"
          name="image_url"
          placeholder="https://…"
          value={form.image_url}
          onChange={handleChange}
        />
      </div>

      <button className="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
