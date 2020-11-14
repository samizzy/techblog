---
title: "Solid Principles Part 2 : Single Responsibility and Interface Segregation"
author: Samrat Saha
date: 2020-14-10
tags:
 - beginner
 - intermediate
 - solid
 - design principle
 - scala
 - java
 - Single Responsibility
 - Interface Segregation
categories:
 - technology
---

Why do I miss so many trivial bugs in my code? What does this class/method actually do? How do I write code in a more maintable way? 
If you ask yourself such questions then this is the right post for you, keep reading.

<!-- more -->

## Introduction
If you still don't know why you should follow or atleast look to include SOLID principles in software design then I highly recommend reading my earlier post on [Liskov Substituion Principle](../May/liskov.html).

Basically it's a set of rules that allow us write code that is easier to understand, maintain, extend and test. However, I should also say that it's not always possible to religiously follow the rules as practically some new requirement may come that totally f*** ups your design, so you do the unthinkable and break the rules and that's totally fine as no perfect code exists.

::: tip Keep in mind
 It's not possible to design your software from the start that will adhere to SOLID, as time goes on you will find certain patterns in your code and will refactor those (this is the most likely case). However, it doesnt mean you shouldn't try your best to follow from start and how will you come to know what principles to apply? this will come to you through experience, knowing your business domain and hopefully these posts can help you a little.
:::
Coming back to our original topic, why have I clubbed Single Responsibility and Interface Segregation, it's because both are very similar in what they mean. Both of them point to reducing the responsibility of what a certain block of code should do.

Alright enough lets get started!

## Single Responsibility

It simply says, _"One module/class/function should only do one thing"_. So it's not hard to understand the meaning, the difficult part is understanding, how does it matter and how do you define this one thing.

I think it would be more clear to understand when we see a code comparsion example. Lets consider a example of Video class.

::: tip Way of life
SRP applies to your whole code architecture, that means modules/classes/functions. Its a way of life..
:::

### Class Bad Code Example

``` java
public class Video{

    long getVideoId(){..}

    int getVideoLength(){...}

    int getCurrentNumberOfWatchingUsers(){...}

    List<Comment> getVideoComments(){...}

    int getTotalViews(){...}

    InputStream getVideoStream(){...}
}
```

The above class is clearly trying to do too many things, it has methods related to actual video content but also related to video statistics and comments. Now from the perspective modelling a real-life object you would say it makes sense that such methods are present in the same class as we all know OOP is all about using __real-life models__.

But it's not correct, OOP gives us the ability to use Inheritance, Encapsulation, Polymorphism in a very easy to use way and designing the `Video Class` like this does will only give us problems, let us look at a better way to do this.

### Class Good Code Example

``` java
class Video {

    long getVideoId(){...}

    int getVideoLength(){...}

    InputStream getVideoStream(){...}

}

class VideoStatistics{

    public VideoStatistics(long videoId){...}

    int getCurrentNumberOfWatchingUsers(){...}

    int getTotalViews(){...}

}


class VideoComment{

    public VideoComment(long videoId){...}

    List<Comments> getComments(int lastNumComments){...}
}
```

I have separated the methods according to their core functionality and also considering their **source of change**. Now above design may not be the best as we are yet to consider other principles but what benefit does this design give us? 

Benefits by isolating core features:
- Easier to understand what is the focus/responsibility of the class.
- Change in one class will not affect each other and hence easier to maintain.
- Easier to design tests as they do less and specific things, also refactoring becomes easier.

As a consequence of above benefits, you will be able to spot bugs in your application more easily.

Now the question is, are our classes still doing **"only one thing"** according to the Single Responsibility Principle? Well technically **NO** but functionally yes and perhaps we can even more drill down on what the class should do? but for a toy example I think you get the point.

We also have to be pragmatic as programmers, sometimes it is more convenient to have a class do multiple things. Consider the String class in java it has methods related to getting Char, substring, indexOf, contains etc. Is this wrong? I feel if you are sure your code is rock solid and it will most likely will not encounter any changes then it's fine.

Perhaps we should also observe a comparision for a method as well

### Function Bad Code Example

Let's say we are writing a program to validate a file
- The file should be \t separated
- There should be exactly 3 columns
- No column can be empty
- Characters !,@,# and * are not allowed in any columns.
- The last column should be a whole number

``` java
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
To a person who has decent experience in Java, should be able to figure out what is happening in above code but he still has to look closely because there a lot of things happening and if he misses some small nuance in code, he could mistake what the method is doing.


### Function Good Code Example

``` java
import java.io.*;

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
                return isNumberOfColsValid(columns, config.expectedColumns) && 
                        isValidColumns(columns, config.onlyNumberColumns);
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

    //Made a config class to keep some config to be dynamic, now some part of the responsibility falls on the caller code, to pass the configuration.
    //In our case, if expectedColumns is 3, then onlyNumberColumns should contain 2 (last column index).
    //Also the separator string, should be passed as "\t"
    //Maybe we also need to do some time of validation, like onlyNumberColumns does not exceed expectedColums? However, i have kept this code simple for clarity.
    public static class ValidatorConfig {
        public final int expectedColumns;
        public final Set<Integer> onlyNumberColumns;
        public final String separator;

        public ValidatorConfig(int expectedColumns, Set<Integer> numberColumns, String separator) {
            this.expectedColumns = expectedColumns;
            this.onlyNumberColumns = numberColumns;
            this.separator = separator;
        }
    }
}

```
What do you expect in a good code? In short terms, the code should be simple. The logic need not be simple ofcourse but your code should not help in making it more difficult to understand.

Use short methods containing only few lines, properly named methods that do one thing. Do not try to do many things in a code block, __deligate__ the pieces of code to a method with __meaningful name__, so that when someone is reading your code, he/she need not _inspect_ your method logic to determine what is happening, the name should be enough. Another important thing, try to make the methods be __functional__, they should take input whatever they need and return the output (__less side-effect__).

## Interface Segregation Principle

It says, *_“Clients should not be forced to depend upon interfaces that they do not use.”_* Another definition says, *_"Many client specific interfaces are better than one general purpose interface"_*

Now here you have to think from the perspective of client of a class(general interface), i.e the user of a class. Also you have to think from the perspective of that class(general inteface) which will be used by multiple clients, when I say multiple clients I don't mean just multiple instances of a client to achieve a similar task but each client wants to a different class.

<img src="/client_class.svg"/>

Now general interface has all methods that are used by different clients but each client will only ever be interested in only a single method. So basically each client sees 2 other methods which are useless to it and this is a violation ISP.

Now you might want to ask that even though it violates ISP, why does it matter? The problem here is as a user/client I am able to see all public methods of GI but I only need one. This might not a seem like a problem with just 3 methods but imagine a interface having 10-15 methods. There should be some kind of facade or a more narrow interface that the client should see and use.

<img src="/revised_interface_di.svg"/>

Narrowing down will help in writing mock classes with less mock methods, as well as give a clear idea on which methods the client actually depends.

However, if there are multiple clients who use various methods and you try to make a special narrowed down interface for each client, that will do more harm than good.
We just need to keep in mind to make narrow interfaces for categories of clients.

And as I said before ISP is _similar_ to SRP that it boils down to reducing the responsibility of a particular block of code!

## Conclusion

If you want to take something away, it would be to make a conscious effort to keep your code short (not at the cost of readability) and not do many things in a class/method.

Thanks for reading!

***
<template>
  <div>
    <div class='comments'>
      <Disqus shortname='tech-9732viigce' />
    </div>
  </div>
</template>

<script>
import { Disqus } from 'vue-disqus'

export default {
  name: 'PostPage',
  components: {
    Disqus
  }
}
</script>






