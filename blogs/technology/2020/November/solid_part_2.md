---
title: "Solid Principles Part 2 : Single Responsibility and Interface Segregation"
author: Samrat Saha
date: 2020-11-14
tags:
 - design principle
categories:
 - technology
---

Why do I miss so many trivial bugs in my code? What does this class/method actually do? How do I write code in a more maintainable way?
If you ask yourself these questions then this is the right post for you — keep reading.

<!-- more -->

## Introduction
If you still don't know why you should follow or at least look to include SOLID principles in software design, I highly recommend reading my earlier post on [Liskov Substituion Principle](../May/liskov.html).

Basically it's a set of rules that allow us to write code that is easier to understand, maintain, extend, and test. That said, it's not always possible to follow the rules religiously — practically speaking, some new requirement may come along that totally f*** ups your design, so you do the unthinkable and break the rules. And that's totally fine, because no perfect code exists.

::: tip Keep in mind
It's not possible to design your software from the start such that it fully adheres to SOLID. As time goes on you will find certain patterns in your code and refactor them (this is the most likely case). However, that doesn't mean you shouldn't try your best to follow them from the start. How will you know which principles to apply? That comes through experience, knowing your business domain, and hopefully these posts help a little.
:::

Coming back to our original topic — why have I clubbed Single Responsibility and Interface Segregation together? It's because both are very similar in what they mean. Both point to reducing the responsibility of what a certain block of code should do.

Alright, enough of that — let's get started!

## Single Responsibility

It simply says, _"One module/class/function should only do one thing"_. The meaning isn't hard to grasp; the difficult part is understanding how it matters and how you define this "one thing."

A code comparison example should make it clearer. Let's consider an example of a `Video` class.

::: tip Way of life
SRP applies to your whole code architecture — modules, classes, functions. It's a way of life.
:::

### Class Bad Code Example

```java
public class Video {

    long getVideoId() { ... }

    int getVideoLength() { ... }

    int getCurrentNumberOfWatchingUsers() { ... }

    List<Comment> getVideoComments() { ... }

    int getTotalViews() { ... }

    InputStream getVideoStream() { ... }
}
```

The above class is clearly trying to do too many things. It has methods related to the actual video content, but also to video statistics and comments. From the perspective of modelling a real-life object, you might say it makes sense to have such methods in the same class — after all, OOP is all about using __real-life models__.

But that's not quite right. OOP gives us Inheritance, Encapsulation, and Polymorphism to use in a clean way, and designing the `Video` class like this will only cause problems. Let's look at a better approach.

### Class Good Code Example

```java
class Video {

    long getVideoId() { ... }

    int getVideoLength() { ... }

    InputStream getVideoStream() { ... }
}

class VideoStatistics {

    public VideoStatistics(long videoId) { ... }

    int getCurrentNumberOfWatchingUsers() { ... }

    int getTotalViews() { ... }
}

class VideoComment {

    public VideoComment(long videoId) { ... }

    List<Comment> getComments(int lastNumComments) { ... }
}
```

I've separated the methods according to their core functionality, also keeping their **source of change** in mind. The design above may not be perfect — we haven't considered the other principles yet — but what benefit does it already give us?

Benefits of isolating core features:
- Easier to understand what the focus/responsibility of a class is.
- Changes in one class won't affect the others, making it easier to maintain.
- Easier to write tests since each class does fewer, more specific things — and refactoring becomes easier too.

As a consequence of these benefits, you'll also be able to spot bugs in your application more easily.

Now the question is: are our classes still doing **"only one thing"** according to the Single Responsibility Principle? Technically **NO**, but functionally yes — and could we drill down further on what each class should do? Probably, but for a toy example I think you get the point.

We also have to be pragmatic as programmers. Sometimes it's more convenient to have a class do multiple things. Consider the `String` class in Java — it has methods for getting chars, substrings, indexOf, contains, and more. Is that wrong? I think if you're confident your code is rock solid and unlikely to change, it's fine.

Perhaps we should also look at a comparison for a method.

### Function Bad Code Example

Let's say we are writing a program to validate a file:
- The file should be \t separated
- There should be exactly 3 columns
- No column can be empty
- Characters !,@,# and * are not allowed in any columns.
- The last column should be a whole number

```java
import java.io.*;

public class FileValidator {

    public boolean validate(File file) throws IOException {
        try (BufferedReader bufferedReader = new BufferedReader(new FileReader(file))) {
            String line = null;
            while ((line = bufferedReader.readLine()) != null) {
                String[] columns = line.split("\t", -1);
                if (columns.length != 3)
                    return false;

                for (int i = 0; i < columns.length; i++) {
                    if (columns[i].trim().isEmpty() || columns[i].matches("[!@#*]"))
                        return false;

                    if (i == 2 && !columns[i].matches("[0-9]+"))
                        return false;
                }
            }
        }
        return true;
    }
}
```

A person with decent Java experience should be able to figure out what's happening above, but they still have to read closely because there's a lot going on. Miss a small nuance and they could easily misread what the method is doing.


### Function Good Code Example

```java
import java.io.*;
import java.util.Collections;
import java.util.Set;
import java.util.regex.Pattern;

public class FileValidator {
    private final ValidatorConfig config;
    private final Pattern SPECIAL_CHAR_REGEX = Pattern.compile("[!@#*]");
    private final Pattern WHOLE_NUMBER_REGEX = Pattern.compile("[0-9]+");

    public FileValidator(ValidatorConfig config) {
        this.config = config;
    }

    public boolean validate(File file) throws IOException {
        try (BufferedReader bufferedReader = new BufferedReader(new FileReader(file))) {
            return bufferedReader.lines().allMatch(line -> {
                String[] columns = splitLine(line, config.separator);
                return isNumberOfColsValid(columns, config.expectedColumns)
                    && isValidColumns(columns, config.onlyNumberColumns);
            });
        }
    }

    private boolean isValidColumns(String[] columns, Set<Integer> onlyNumberCols) {
        for (int i = 0; i < columns.length; i++) {
            if (isEmptyOrHasSpecialChars(columns[i]))
                return false;
            if (onlyNumberCols.contains(i) && !isWholeNumber(columns[i]))
                return false;
        }
        return true;
    }

    private String[] splitLine(String line, String separator) {
        return line.split(separator, -1);
    }

    private boolean isNumberOfColsValid(String[] cols, int expectedCols) {
        return cols.length == expectedCols;
    }

    private boolean isEmptyOrHasSpecialChars(String col) {
        return col.trim().isEmpty() || SPECIAL_CHAR_REGEX.matcher(col).matches();
    }

    private boolean isWholeNumber(String col) {
        return WHOLE_NUMBER_REGEX.matcher(col).matches();
    }

    // Config class keeps validation rules dynamic; the caller is responsible for passing correct values.
    // If expectedColumns is 3, onlyNumberColumns should contain 2 (last column index).
    public static class ValidatorConfig {
        public final int expectedColumns;
        public final Set<Integer> onlyNumberColumns;
        public final String separator;

        public ValidatorConfig(int expectedColumns, Set<Integer> numberColumns, String separator) {
            this.expectedColumns = expectedColumns;
            this.onlyNumberColumns = Collections.unmodifiableSet(numberColumns);
            this.separator = separator;
        }
    }
}
```

What do you expect from good code? Simply put, it should be easy to read. The logic doesn't have to be simple — but your code shouldn't make it harder to understand than it needs to be.

Use short methods with only a few lines. Give them meaningful names that describe what they do. Don't try to do many things in one block — __delegate__ pieces of logic to a method with a __meaningful name__, so that when someone reads your code, they don't need to _inspect_ the method body to figure out what's happening; the name should be enough. One more thing: try to keep methods __functional__ — they should take whatever inputs they need and return the output (__fewer side effects__).

## Interface Segregation Principle

It says, *_"Clients should not be forced to depend upon interfaces that they do not use."_* Another way to put it: *_"Many client-specific interfaces are better than one general-purpose interface."_*

Here you have to think from two angles: the perspective of the client of a class (i.e., the user), and the perspective of the class itself (the general interface) which is used by multiple clients. When I say multiple clients, I don't just mean multiple instances doing a similar task — I mean each client wants to use the class for a different purpose.

<img src="/client_class.svg"/>

The general interface has all the methods used by different clients, but each client will only ever care about one of them. So each client sees two methods that are completely useless to it — and that's a violation of ISP.

You might ask: even if it violates ISP, why does it actually matter? The problem is that as a client I can see all the public methods of the general interface, even though I only need one. With just 3 methods this might seem like no big deal, but imagine an interface with 10–15 methods. There should be some kind of facade or a narrower interface for clients to see and use.

<img src="/revised_interface_di.svg"/>

Narrowing it down helps in writing mock classes with fewer mock methods, and gives a clearer picture of which methods a client actually depends on.

That said, if there are multiple clients that each use various methods and you try to create a special narrow interface for every single one of them, that will do more harm than good.
The key is to make narrow interfaces for *categories* of clients, not for every individual one.

And as I said earlier, ISP is _similar_ to SRP in that it all boils down to reducing the responsibility of a particular block of code!

## Conclusion

If there's one thing to take away, it's this: make a conscious effort to keep your code short (without sacrificing readability) and avoid cramming too many responsibilities into a single class or method.

Thanks for reading!
