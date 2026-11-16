// pages/api/reviews.js

import axios from 'axios';

export default async function handler(req, res) {

  // ==========================================================
  // Backend base URL
  // ==========================================================

  const BACKEND_DOMAIN = process.env.BACKEND_DOMAIN;

  // ==========================================================
  // GET: Fetch referrals assigned to an SBU reviewer
  // ==========================================================

  if (req.method === 'GET') {

    const { emp_id } = req.query;

    // Validate employee ID
    if (!emp_id) {
      return res.status(400).json({
        error: 'emp_id is required',
      });
    }

    try {

      // Fetch referrals and review history from Django
      const backendRes = await axios.get(
        `${BACKEND_DOMAIN}/api/reviews/`,
        {
          params: {
            emp_id,
          },
        }
      );

      return res.status(backendRes.status).json(
        backendRes.data
      );

    } catch (error) {

      console.error(
        'Error fetching reviews:',
        error.response?.data || error.message
      );

      // Preserve Django's original error response
      return res
        .status(error.response?.status || 500)
        .json(
          error.response?.data || {
            error: 'Failed to fetch reviews',
          }
        );
    }
  }

  // ==========================================================
  // POST: Submit the FIRST SBU review
  // ==========================================================

  if (req.method === 'POST') {

    try {

      // Extract all required fields
      const {
        referral_id,
        decision,
        comment,
        emp_id,

        // NEW: Optimistic concurrency field
        expected_review_id,

      } = req.body || {};

      // ======================================================
      // Validate required fields
      // ======================================================

      if (
        !referral_id ||
        !decision ||
        !emp_id ||
        typeof comment !== 'string' ||
        !comment.trim()
      ) {

        return res.status(400).json({
          error: 'Missing required review fields',
        });
      }

      // ======================================================
      // Validate concurrency field
      // ======================================================

      // Important:
      // null is VALID for an initial review.
      //
      // undefined means the frontend did not send the field.

      if (expected_review_id === undefined) {

        return res.status(400).json({
          error: 'expected_review_id is required',
        });
      }

      // ======================================================
      // Submit initial review to Django
      // ======================================================

      const backendRes = await axios.post(
        `${BACKEND_DOMAIN}/api/reviews/${referral_id}/submit/`,
        {
          decision,
          comment: comment.trim(),
          emp_id,

          // NEW: Initial review should send null
          expected_review_id,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return res
        .status(backendRes.status)
        .json(backendRes.data);

    } catch (error) {

      console.error(
        'Error submitting review:',
        error.response?.data || error.message
      );

      // Preserve 409 conflicts, 403 permissions, etc.
      return res
        .status(error.response?.status || 500)
        .json(
          error.response?.data || {
            error: 'Failed to submit review',
          }
        );
    }
  }

  // ==========================================================
  // PUT: Revise an EXISTING SBU review
  // ==========================================================

  if (req.method === 'PUT') {

    try {

      const {
        referral_id,
        decision,
        comment,
        emp_id,

        // NEW: ID of the latest review seen by the reviewer
        expected_review_id,

      } = req.body || {};

      // ======================================================
      // Validate required fields
      // ======================================================

      if (
        !referral_id ||
        !decision ||
        !emp_id ||
        typeof comment !== 'string' ||
        !comment.trim()
      ) {

        return res.status(400).json({
          error: 'Missing required review fields',
        });
      }

      // ======================================================
      // Validate concurrency field
      // ======================================================

      // A revision must reference an existing review ID.
      // Therefore, null and undefined are both invalid.

      if (
        expected_review_id === undefined ||
        expected_review_id === null ||
        expected_review_id === ''
      ) {

        return res.status(400).json({
          error: 'expected_review_id is required for revisions',
        });
      }

      // ======================================================
      // Forward revision request to Django
      // ======================================================

      const backendRes = await axios.put(
        `${BACKEND_DOMAIN}/api/reviews/${referral_id}/update/`,
        {
          decision,
          comment: comment.trim(),
          emp_id,

          // NEW: Required to detect concurrent review changes
          expected_review_id,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return res
        .status(backendRes.status)
        .json(backendRes.data);

    } catch (error) {

      console.error(
        'Error updating review:',
        error.response?.data || error.message
      );

      // Preserve Django's detailed errors
      return res
        .status(error.response?.status || 500)
        .json(
          error.response?.data || {
            error: 'Failed to update review',
          }
        );
    }
  }

  // ==========================================================
  // Unsupported HTTP methods
  // ==========================================================

  res.setHeader(
    'Allow',
    ['GET', 'POST', 'PUT']
  );

  return res.status(405).json({
    error: 'Method not allowed',
  });
}