# COMP 451 – ER Diagram

Create an **entity-relationship (ER) diagram** showing the data your application will need to store, retrieve, or use.

The goal is to think carefully about your application's data requirements before implementation, reducing the likelihood of discovering significant gaps in your data model during development.

### Requirements

Your diagram should include:

- **Entities:** All major types of data your application will work with.
- **Attributes:** Every individual piece of information associated with each entity (e.g., a `User` might have `userId`, `firstName`, `lastName`, and `email`). **Be thorough!** I want to see the actual data you anticipate needing, not just entity names.
- **Relationships:** How entities relate to one another, including cardinality constraints (optional/mandatory and one/many).
- **Identifiers:** How individual entities are uniquely identified, where applicable.

Use proper ER notation, including attribute types (simple, composite, multi-valued, etc.) and relationship constraints.

### Database and External API Considerations



Your application may use a relational database, NoSQL, external APIs, or some combination. You should create an ER diagram regardless of where your data is stored.

If your application obtains data from an external API, include the entities, attributes, and relationships your application needs from that API. You do not need to model the external organization's entire database or know how it is implemented.


### Think Ahead!

Consider the major features and workflows of your application. What information will each feature need to display, create, update, or retrieve? Does your diagram account for all of it?

Your design may change during development, but the goal is to anticipate as many data requirements as possible now.

### Use of AI

You may use AI to brainstorm entities, identify missing attributes, explore relationships, or review your diagram. However, **you must own your design**. You should understand every entity, attribute, and relationship and be able to explain and defend your choices.

### Submission

You may create your diagram electronically or by hand (paper/pencil or whiteboard). It must be legible!

**Submit your diagram as a PDF document.**