---
title: Taking a look at Scala futures
author: Samrat Saha
date: 2020-05-17
tags:
 - beginner
 - scala
 - futures
categories:
 - technology
---

## Towards the Future
What are futures? Is this a concept limited to a select few in Scala? Will it affect your future? We are going to find out about all this and more. Keep reading.

<!-- more -->

<img src="/augmented-reality-education-futre.jpg"/>

[[toc]]

## So what are Futures?
It is a _model_ of parallel programming — there are other models such as the actor model. It is not limited to Scala; there are similar APIs in Java, JavaScript, and other languages as well.

An informal definition would be: a Future is like a lazy person (me). If you give it some task to do, it doesn't do it immediately — instead it tells you, _"Yeah, I'm busy right now... will do it later, but here's a **gift** you can use instead"_. This **gift** is very _evil_ because it is another Future, but this one contains our result. The catch is, if you try to open it, there's no guarantee you'll find anything inside.

So instead of opening it, you work with the **gift** itself. You might ask, how can I work with the **gift** itself? At some point I will need to open the **gift**, right? (You can.)

We will do exactly those things, so keep reading :)

## Need for Futures
_Parallel programming_? People have been doing parallel programming before, right? Java developers will say they have `java.lang.Thread` — why would they bother with futures?

The answer is that Futures are a __wrapper__ over threads; they are a higher-level programming API. They provide many convenient capabilities that help developers focus on their programming logic instead of thread creation and their _interaction_. We will see the advantages ahead.

::: warning Note
Using futures freely for trivial calculations will just result in more time spent, as most of the time will go into thread context switches. You ideally want to use futures on tasks that usually take time, like IO or some heavy processing — but for the sake of this demo we have chosen simple tasks.
:::

## Let's do some Coding!

### Scala Version
I am using Scala version 2.11.12 and you can find the Scala docs for futures [here](https://www.scala-lang.org/api/2.11.12/index.html#scala.concurrent.Future)

### Basic Starter Code

```scala
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits._

object Main {

    def main(args: Array[String]): Unit = {
        val numString = "123"

        val future = Future { // <-- Future code block
            println(stringToInt(numString))
        }
    }

    def stringToInt(numString: String): Int = numString.toInt
}
```

So what have we done here?

We have defined a function `stringToInt()` that takes a string as input and converts it to an integer. We are not concerned with the string being an invalid number for now.

We want to print the number returned, so we wrap the call to `println` using `Future{..code block..}`.

::: tip Scala 101
In Scala, every expression returns something — in the above case, it returns a `Future[Unit]` as println returns Unit.
:::

So yeah, we are done! This code will print the value 123 in a separate thread! Now let's execute this code.

Wait... the main function exits and you don't see anything printed on the console?

The reason is that the Future is executed on a separate thread, but before that thread could do anything, the main thread exits the main function and the JVM shuts down!
So let's add this line at the end to wait until the future finishes. Don't forget to add `import scala.concurrent.duration.Duration`.

```scala
Await.result(future, Duration.Inf)
```

And now you will see `123` on the console. :tada:

::: tip Tip
You can run all the examples online on [scastie](https://scastie.scala-lang.org/) and you don't have to write inside main — you can directly start coding away! :heart_eyes:
:::

#### Understanding the Code

We skipped over a lot of things before, so let's look at them in a bit more detail.

To use `Future{}` we need to import **`import scala.concurrent.ExecutionContext.Implicits._`**, otherwise you will get the error **`"No implicits found for parameter: ExecutionContext"`**.

So implicitly you are passing an execution context every time you use `Future{}` — without this it won't compile.

So what is an ExecutionContext? For simplicity, let's consider it just a thread pool. Futures require you to pass it every time. **YES, EVERY TIME** — and that is why it's convenient to make it an implicit argument. :)

For our example we are using the pre-existing global execution context present in **`scala.concurrent.ExecutionContext.Implicits`**. It uses the fork-join pool that has been available since Java 8.

The above example was too simple — let's try something a little more practical.

### Future Chaining
The main advantage of futures in Scala is that you can chain a series of functions one after the other. This makes it really powerful, and to achieve this there are several methods we can use.

::: tip Gift
This is what I meant earlier when I said we _use_ the **gift** itself.
:::

#### map and flatMap
Let's look at the below examples for map and flatMap.

Suppose you have a source of strings coming from somewhere and each string is alphanumeric — more precisely, for our example there is a number buried within characters.
You are tasked with extracting the number and printing it. You look at the problem and devise a strategy.

The strategy is:
- Get string
- Replace all English characters
- Trim all the spaces
- Convert to integer
- Print result

and in that **sequence**.

```scala
package com.samizzy.scala.basic.map_flatmap

import scala.concurrent.ExecutionContext.Implicits._
import scala.concurrent.duration.Duration
import scala.concurrent.{Await, Future}

object Main {

    def main(args: Array[String]): Unit = {
        val future =
            Future(getString)
                .map(sanitize)
                .map(strip)
                .map(stringToInt)
                .map(println)

        Await.result(future, Duration.Inf)
    }

    def getString: String = " 123 hey there"

    def sanitize(alphaNumeric: String): String = alphaNumeric.replaceAll("[a-zA-Z]", "")

    def strip(numString: String): String = numString.trim

    def stringToInt(numString: String): Int = numString.toInt
}
```

Each step in the strategy is made into a function and we have chained them using the `map` method on Future. _Cool, right?_ :D.

::: tip Benefit
Low-level stuff such as waiting for a thread to finish and then passing its result to a new thread is taken care of by the futures API.
:::

In each `map` call you get the output of the previous step, and you can then perform any operation on it — you're basically being spoon-fed the inputs.

It's important to take a look at the signature of **map**,

```scala
// T type corresponds to type the current future holds and
// S type corresponds to type that map shall convert to.
def map[S](fn: (T) => S): Future[S] = { ... }
```

It takes a function that accepts an argument of type `T` and transforms it into type `S`. The `map` method itself returns a `Future[S]`, so basically the passed function is responsible for doing the transformation, and then `map` wraps that result in a Future!

Now suppose we're told that we will receive another integer and we need to add it to the extracted integer.

```scala
val toAdd: Int = getToAdd
val future =
    Future(getString)
        .map(sanitize)
        .map(strip)
        .map(stringToInt)
        .map(_ + toAdd)
        .map(println)

Await.result(future, Duration.Inf)

def getToAdd: Int = 20
```

So you say, **"Hold my beer"**.

You roll up your sleeves and smash in the above solution — but then there's a **twist**. You're told the number to add is not constant and can randomly change, since it's being fetched from an external source, so you always need the latest value.

On top of that, another developer has already written the code for fetching and adding the number, and it returns a `Future[Int]` instead of a plain `Int`.

But how do you chain a future from another source? To save us from this hell, `flatMap` comes to the rescue.

```scala
val future =
    Future(getString)
        .map(sanitize)
        .map(strip)
        .map(stringToInt)
        .flatMap(getAdded) // getAdded returns Future[Int] and flatMap also returns Future[Int]
        .map(println)

Await.result(future, Duration.Inf)

def getAdded(num: Int): Future[Int] = Future(Random.nextInt(201) + num) // imagine this is from an external source
```

If we take a look at the signature of **flatMap**,

```scala
// flatMap takes a function that itself returns Future
def flatMap[S](fn: (T) => Future[S]): Future[S]
```

it takes a function that accepts an argument of type `T` (similar to map), but this function returns a `Future[S]` instead of a plain `S` like map does.

So `flatMap` is useful when you have a function that itself returns a Future rather than a plain value.

#### zip
But let's say the developer had only implemented the functionality to fetch the number and not add-and-return — then we can use the `zip` method. It combines the result of the current future (the one on which `.zip` is called) with another future passed as an argument. When I say combine, I mean it delivers both results as a tuple. Here's the code.

```scala
val future =
    Future(getString)
        .map(sanitize)
        .map(strip)
        .map(stringToInt)
        .zip(getNum)
        .map(tuple => tuple._1 + tuple._2)
        .map(println)

Await.result(future, Duration.Inf)

def getNum: Future[Int] = Future(Random.nextInt(201))
```

Actually we could have achieved the same thing with **flatMap** — it's not hard to figure out, so I'll leave that one up to you.

So that's all for now! Thanks for reading! We'll take a look at the rest of the methods some other time. Hope you feel a little more like a future gangsta now :sunglasses:

## Code Samples
All code on this page is available on this [GitHub repository](https://github.com/samizzy/scala-futures-basics)
