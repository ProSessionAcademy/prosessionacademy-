{
  "name": "Group",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Group name"
    },
    "description": {
      "type": "string",
      "description": "Group description"
    },
    "group_type": {
      "type": "string",
      "enum": [
        "work",
        "university",
        "community"
      ],
      "description": "Type of group"
    },
    "company_name": {
      "type": "string",
      "description": "Company name (for work groups)"
    },
    "admin_emails": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "default": [],
      "description": "List of admin emails who can approve members"
    },
    "members": {
      "type": "array",
      "description": "Approved group members",
      "items": {
        "type": "object",
        "properties": {
          "user_email": {
            "type": "string"
          },
          "full_name": {
            "type": "string"
          },
          "employee_number": {
            "type": "string"
          },
          "joined_date": {
            "type": "string"
          },
          "role": {
            "type": "string",
            "enum": [
              "member",
              "admin"
            ],
            "default": "member"
          },
          "points": {
            "type": "number",
            "default": 0
          },
          "badges": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "default": []
          }
        }
      },
      "default": []
    },
    "pending_requests": {
      "type": "array",
      "description": "Pending join requests",
      "items": {
        "type": "object",
        "properties": {
          "user_email": {
            "type": "string"
          },
          "full_name": {
            "type": "string"
          },
          "employee_number": {
            "type": "string"
          },
          "request_date": {
            "type": "string"
          },
          "status": {
            "type": "string",
            "enum": [
              "pending",
              "approved",
              "rejected"
            ],
            "default": "pending"
          }
        }
      },
      "default": []
    },
    "group_chat_messages": {
      "type": "array",
      "description": "Group chat messages",
      "items": {
        "type": "object",
        "properties": {
          "sender_email": {
            "type": "string"
          },
          "sender_name": {
            "type": "string"
          },
          "message": {
            "type": "string"
          },
          "timestamp": {
            "type": "string"
          },
          "attachments": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "default": []
          }
        }
      },
      "default": []
    },
    "shared_documents": {
      "type": "array",
      "description": "Shared documents",
      "items": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string"
          },
          "file_url": {
            "type": "string"
          },
          "uploaded_by": {
            "type": "string"
          },
          "uploaded_date": {
            "type": "string"
          },
          "description": {
            "type": "string"
          }
        }
      },
      "default": []
    },
    "checklists": {
      "type": "array",
      "description": "Group checklists",
      "items": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string"
          },
          "items": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "text": {
                  "type": "string"
                },
                "completed": {
                  "type": "boolean",
                  "default": false
                },
                "completed_by": {
                  "type": "string"
                },
                "completed_date": {
                  "type": "string"
                }
              }
            }
          },
          "created_by": {
            "type": "string"
          },
          "created_date": {
            "type": "string"
          }
        }
      },
      "default": []
    },
    "tasks": {
      "type": "array",
      "description": "Group tasks",
      "items": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "assigned_to": {
            "type": "string"
          },
          "due_date": {
            "type": "string"
          },
          "status": {
            "type": "string",
            "enum": [
              "todo",
              "in_progress",
              "completed"
            ],
            "default": "todo"
          },
          "created_by": {
            "type": "string"
          },
          "created_date": {
            "type": "string"
          }
        }
      },
      "default": []
    },
    "meeting_room_url": {
      "type": "string",
      "description": "Dedicated meeting room URL for this group"
    },
    "logo_url": {
      "type": "string",
      "description": "Group logo/image"
    },
    "activity_log": {
      "type": "array",
      "description": "Activity log for points tracking",
      "items": {
        "type": "object",
        "properties": {
          "user_email": {
            "type": "string"
          },
          "action": {
            "type": "string"
          },
          "points": {
            "type": "number"
          },
          "timestamp": {
            "type": "string"
          },
          "description": {
            "type": "string"
          }
        }
      },
      "default": []
    }
  },
  "required": [
    "name",
    "group_type"
  ]
}