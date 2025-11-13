const axios = require('axios');

// Mock DOI service (replace with actual CrossRef integration)
const assignDOI = async (metadata) => {
  try {
    // In production, integrate with CrossRef API
    // This is a mock implementation
    
    const doiPrefix = '10.12345'; // Your DOI prefix from CrossRef
    const doiSuffix = `pujms.${new Date().getFullYear()}.${Math.random().toString(36).substr(2, 9)}`;
    const doi = `${doiPrefix}/${doiSuffix}`;

    // Mock CrossRef API call
    // In production, you would make an actual API call:
    /*
    const response = await axios.post(
      `${process.env.CROSSREF_API_URL}/deposits`,
      {
        doi: doi,
        title: metadata.title,
        authors: metadata.authors,
        publication_date: metadata.publishedDate,
        // ... other CrossRef metadata
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CROSSREF_API_KEY}`
        }
      }
    );
    */

    console.log('DOI assigned (mock):', doi);
    console.log('Metadata:', metadata);

    return doi;
  } catch (error) {
    console.error('DOI assignment error:', error);
    throw new Error(`Failed to assign DOI: ${error.message}`);
  }
};

// Validate DOI format
const validateDOI = (doi) => {
  const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
  return doiRegex.test(doi);
};

// Resolve DOI to URL
const resolveDOI = (doi) => {
  return `https://doi.org/${doi}`;
};

// Update DOI metadata
const updateDOIMetadata = async (doi, metadata) => {
  try {
    // In production, make API call to CrossRef to update metadata
    console.log('Updating DOI metadata (mock):', doi);
    console.log('New metadata:', metadata);

    return { success: true, doi };
  } catch (error) {
    throw new Error(`Failed to update DOI metadata: ${error.message}`);
  }
};

module.exports = {
  assignDOI,
  validateDOI,
  resolveDOI,
  updateDOIMetadata
};





/*
It **uses Mock DOI** implementation, not real CrossRef integration.

Here's what's happening:

## Current DOI Implementation (Mock)


## What This Means:

✅ **Mock DOI Features Implemented:**
- Generates fake DOIs in the format `10.12345/pujms.2025.xyz123`
- Simulates the DOI assignment workflow
- Tracks deposit status (pending, processing, success, failed)
- Records deposit history
- Provides retry mechanisms
- Admin UI for monitoring and retrying

❌ **Real CrossRef NOT Implemented:**
- No actual API calls to CrossRef
- No real DOI registration with CrossRef servers
- No validation against CrossRef schema
- DOIs are not resolvable through https://doi.org/

## Why Mock Implementation?

As you requested in your original requirement:
> "**FR-6: stick to mock DOI implementation**"

The implementation fully supports the **infrastructure** for DOI management (tracking, retrying, admin UI, stable URLs), but the actual CrossRef API integration is commented out and ready to be activated later.

## To Switch to Real CrossRef Later:

You would need to:

1. **Get CrossRef credentials** (DOI prefix, API key)
2. **Uncomment the API call** in `doiService.js`
3. **Add environment variables**:
   ```env
   CROSSREF_API_URL=https://api.crossref.org
   CROSSREF_API_KEY=your-real-key
   DOI_PREFIX=10.xxxxx  # Your assigned prefix
   ```
4. **Implement CrossRef metadata mapping** (their XML/JSON schema)
5. **Test in CrossRef sandbox first**

The current implementation gives you all the **operational infrastructure** (admin UI, retry logic, status tracking, stable URLs) while using mock DOIs that look real but aren't registered.

---

**Would you like me to:**
1. Keep it as is (mock DOI)?
2. Provide the real CrossRef integration code now?
3. Document the migration path from mock to real CrossRef?

*/
