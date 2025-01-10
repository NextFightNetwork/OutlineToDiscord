import dotenv from "dotenv";
import express from "express";
import axios from "axios";

dotenv.config();

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK;
const PORT = process.env.PORT || 3123;
const INCLUDE_COLLECTIONS = (process.env.INCLUDE_COLLECTIONS || "").split(',');

// console.log("Allowed Collections: " + INCLUDE_COLLECTIONS);

app.post("/outline-webhook", async (req, res) => {
  const { event, payload } = req.body;

  if ( INCLUDE_COLLECTIONS[0] && INCLUDE_COLLECTIONS[0] > 1 ) { // I hope this is strong enough error handling 
    const documentCollection = await getDocumentCollection(payload.model.documentId);	  
    if (!INCLUDE_COLLECTIONS.includes(documentCollection)) {
      console.log("Skipping Comment");
      return res.sendStatus(200);
    }
  } 

  let embedData;

  switch (event) {
    case "documents.delete":
      embedData = createDeleteEmbed(payload);
      break;
    case "revisions.create":
      embedData = createRevisionEmbed(payload);
      break;
    case "documents.update":
      embedData = createUpdateEmbed(payload);
      break;
    case "webhookSubscriptions.update":
      embedData = createWebhookSubscriptionEmbed(payload);
      break;
    case "teams.update":
      embedData = createTeamUpdateEmbed(payload);
      break;
    case "documents.create":
      embedData = createDocumentCreateEmbed(payload);
      break;
    case "stars.create":
      embedData = createStarCreateEmbed(payload);
      break;
    case "stars.delete":
      embedData = createStarDeleteEmbed(payload);
      break;
    case "documents.title_change":
      embedData = createDocumentTitleChangeEmbed(payload);
      break;
    case "documents.publish":
      embedData = createDocumentPublishEmbed(payload);
      break;
    case "pins.create":
      embedData = createPinCreateEmbed(payload);
      break;
    case "documents.permanent_delete":
      embedData = createPermanentDeleteEmbed(payload);
      break;
    case "documents.archive":
      embedData = createDocumentArchiveEmbed(payload);
      break;
    case "comments.create":
      const documentCreateDetails = await getDocumentDetails(payload.model.documentId);
      embedData = createCommentEmbed(payload, documentCreateDetails);
      break;
    case "comments.delete":
      const documentDeleteDetails = await getDocumentDetails(payload.model.documentId);
      embedData = createCommentDeleteEmbed(payload, documentDeleteDetails);
      break;
    case "comments.update":
      const documentUpdateDetails = await getDocumentDetails(payload.model.documentId);
      embedData = createCommentUpdateEmbed(payload, documentUpdateDetails);
      break;

    default:
      console.log(
        "Unsupported event:",
        event,
        "Payload:",
        JSON.stringify(payload)
      );
      return res.sendStatus(200);
  }

  try {
    await axios.post(DISCORD_WEBHOOK_URL, { embeds: [embedData] });
    res.sendStatus(200);
  } catch (error) {
    console.error("Error sending Discord webhook:", error);
    res.sendStatus(500);
  }
});

function createDeleteEmbed(payload) {
  return {
    title: "📄 Document Deleted",
    color: 0xff0000,
    fields: [
      { name: "Title", value: payload.model.title },
      { name: "Deleted By", value: payload.model.updatedBy.name },
      {
        name: "Deleted At",
        value: new Date(payload.model.deletedAt).toLocaleString(),
      },
    ],
    footer: { text: `Document ID: ${payload.model.id}` },
  };
}

function createPermanentDeleteEmbed(payload) {
  return {
    title: "🗑️ Document Permanently Deleted",
    color: 0xff0000,
    fields: [{ name: "Event ID", value: payload.id }],
    footer: {
      text: "This document has been permanently removed and cannot be recovered.",
    },
  };
}

function createRevisionEmbed(payload) {
  return {
    title: "📝 Document Revised",
    color: 0xffff00,
    fields: [
      { name: "Title", value: payload.model.title },
      { name: "Revised By", value: payload.model.createdBy.name },
      {
        name: "Revised At",
        value: new Date(payload.model.createdAt).toLocaleString(),
      },
    ],
    footer: { text: `Document ID: ${payload.model.documentId}` },
  };
}

function createUpdateEmbed(payload) {
  return {
    title: "🔄 Document Updated",
    color: 0x00ff00,
    fields: [
      { name: "Title", value: payload.model.title },
      { name: "Updated By", value: payload.model.updatedBy.name },
      {
        name: "Updated At",
        value: new Date(payload.model.updatedAt).toLocaleString(),
      },
    ],
    footer: { text: `Document ID: ${payload.model.id}` },
  };
}

function createWebhookSubscriptionEmbed(payload) {
  return {
    title: "🔗 Webhook Subscription Updated",
    color: 0x00ffff,
    fields: [
      { name: "Name", value: payload.model.name },
      { name: "URL", value: payload.model.url },
      { name: "Events", value: payload.model.events.join(", ") },
      { name: "Enabled", value: payload.model.enabled ? "Yes" : "No" },
      {
        name: "Updated At",
        value: new Date(payload.model.updatedAt).toLocaleString(),
      },
    ],
    footer: { text: `Subscription ID: ${payload.model.id}` },
  };
}

function createTeamUpdateEmbed(payload) {
  return {
    title: "👥 Team Updated",
    color: 0xffa500,
    fields: [
      { name: "Name", value: payload.model.name },
      { name: "URL", value: payload.model.url },
    ],
    footer: { text: `Team ID: ${payload.model.id}` },
  };
}

function createDocumentCreateEmbed(payload) {
  return {
    title: "📄 New Document Created",
    color: 0x00ff00,
    fields: [
      { name: "Title", value: payload.model.title || "Untitled" },
      { name: "Created By", value: payload.model.createdBy.name },
      {
        name: "Created At",
        value: new Date(payload.model.createdAt).toLocaleString(),
      },
    ],
    footer: { text: `Document ID: ${payload.model.id}` },
  };
}

function createStarCreateEmbed(payload) {
  return {
    title: "⭐ Item Starred",
    color: 0xffd700,
    fields: [
      {
        name: "Type",
        value: payload.model.documentId ? "Document" : "Collection",
      },
      {
        name: "Starred At",
        value: new Date(payload.model.createdAt).toLocaleString(),
      },
    ],
    footer: { text: `Star ID: ${payload.model.id}` },
  };
}

function createStarDeleteEmbed(payload) {
  return {
    title: "🚫 Star Removed",
    color: 0x808080,
    fields: [{ name: "Removed At", value: new Date().toLocaleString() }],
    footer: { text: `Star ID: ${payload.id}` },
  };
}

function createDocumentTitleChangeEmbed(payload) {
  return {
    title: "✏️ Document Title Changed",
    color: 0x1e90ff,
    fields: [
      { name: "New Title", value: payload.model.title },
      { name: "Changed By", value: payload.model.updatedBy.name },
      {
        name: "Changed At",
        value: new Date(payload.model.updatedAt).toLocaleString(),
      },
    ],
    footer: { text: `Document ID: ${payload.model.id}` },
  };
}

function createDocumentPublishEmbed(payload) {
  return {
    title: "🌐 Document Published",
    color: 0x32cd32,
    fields: [
      { name: "Title", value: payload.model.title },
      { name: "Published By", value: payload.model.updatedBy.name },
      {
        name: "Published At",
        value: new Date(payload.model.publishedAt).toLocaleString(),
      },
    ],
    footer: { text: `Document ID: ${payload.model.id}` },
  };
}

function createPinCreateEmbed(payload) {
  return {
    title: "📌 Item Pinned",
    color: 0xdc143c,
    fields: [
      {
        name: "Type",
        value: payload.model.documentId ? "Document" : "Collection",
      },
      {
        name: "Pinned At",
        value: new Date(payload.model.createdAt).toLocaleString(),
      },
    ],
    footer: { text: `Pin ID: ${payload.model.id}` },
  };
}

function createDocumentArchiveEmbed(payload) {
  return {
    title: "🗄️ Document Archived",
    color: 0x808080,
    fields: [
      { name: "Title", value: payload.model.title },
      { name: "Archived By", value: payload.model.updatedBy.name },
      {
        name: "Archived At",
        value: new Date(payload.model.archivedAt).toLocaleString(),
      },
    ],
    footer: { text: `Document ID: ${payload.model.id}` },
  };
}

function createCommentEmbed(payload, documentDetails) {
  return {
    title: "💬 New Comment",
    color: 0x1e90ff,
    fields: [
      { name: "Comment", value: payload.model.data.content[0].content[0].text },
      { name: "Commented By", value: payload.model.createdBy.name },
      { name: "Document Title", value: documentDetails.title },
      { name: "Document Link", value: `${process.env.OUTLINE_URL}${documentDetails.url}` // Link to the document
      },
    ],
    footer: { name: "Created At", value: new Date(payload.model.createdAt).toLocaleString() },
  };
}

function createCommentDeleteEmbed(payload, documentDetails) {
  return {
    title: "🗑️ Comment Deleted",
    color: 0xff0000,
    fields: [
      { name: "Deleted By", value: payload.model.createdBy.name },
      { name: "Document Title", value: documentDetails.title },
      { name: "Document Link", value: `${process.env.OUTLINE_URL}${documentDetails.url}` },
    ],
    footer: { text: `Comment ID: ${payload.model.id} - Deleted At: ${new Date().toLocaleString()}` },
  };
}

function createCommentUpdateEmbed(payload, documentDetails) {
  return {
    title: "✏️ Comment Updated",
    color: 0x1e90ff,
    fields: [
      { name: "Updated Comment", value: payload.model.data.content[0].content[0].text },
      { name: "Updated By", value: payload.model.createdBy.name },
      { name: "Document Title", value: documentDetails.title },
      { name: "Document Link", value: `${process.env.OUTLINE_URL}${documentDetails.url}` },
    ],
    footer: { text: `Comment ID: ${payload.model.id} - Updated At: ${new Date(payload.model.updatedAt).toLocaleString()}` },
  };
}


async function getDocumentDetails(documentId) {
  try {
    const response = await axios.post(
        `${process.env.OUTLINE_URL}/api/documents.info`,
        { id: documentId },
        {
          headers: { Authorization: `Bearer ${process.env.OUTLINE_API_KEY}` },
        }
    );

    const document = response.data.data;
    return {
      title: document.title,
      url: document.url,
    };
  } catch (error) {
    console.error("Error fetching document details:", error);
    return { title: "Unknown Document", url: "#" };
  }
}

async function getDocumentCollection(documentId) {
  try {
    const response = await axios.post(
        `${process.env.OUTLINE_URL}/api/documents.info`,
        { id: documentId },
        {
          headers: { Authorization: `Bearer ${process.env.OUTLINE_API_KEY}` },
        }
    );

    return response.data.data.collectionId;
  } catch (error) {
    console.error("Error fetching document collectionId:", error);
    return { title: "Unknown Document", url: "#" };
  }
}



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Outline webhook URL: http://domain:${PORT}/outline-webhook`);
});
