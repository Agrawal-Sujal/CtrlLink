package com.sunflower.ctrllink.utils;

import org.springframework.stereotype.Component;

@Component
public class Base62IdEncoder {

    private static final String BASE62 =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int BASE = 62;

    public String encode(long id) {
        if (id < 0) {
            throw new IllegalArgumentException("ID Must be Positive Number");
        }

        StringBuilder sb = new StringBuilder();

        do {
            int reminder = (int) (id % BASE);
            sb.append(BASE62.charAt(reminder));
            id /= BASE;
        }
        while (id > 0);
        return sb.reverse().toString();

    }

    public long decode(String shortId) {
        if(!isValid(shortId)) {
            throw new IllegalArgumentException("Invalid ShortId");
        }

        long result=0;
        for(char c:shortId.toCharArray()) {
            result=(result*BASE + BASE62.indexOf(c));
        }
        return result;
    }

    public boolean isValid(String shortId) {
        if(shortId == null ||  shortId.isEmpty()) {
            return false;
        }
        for(char c:shortId.toCharArray()) {
            if(BASE62.indexOf(c)==-1){
                return false;
            }
        }
        return true;
    }
}
