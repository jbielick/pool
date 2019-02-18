raison d'etre
---

generic-pool disadvantages:

- no ability to start the pool and see if connection failed (just once). you just get n errors thrown where n is the pool size and there's no promise you can get rejected when this occurs. You can only listen for factory create errors
- when connections in the pool die and don't validate, they aren't removed from the pool. thus you can lose connectivity and have a pool full of dead connections that won't reconnect or be destroyed until the idle evictor gets them
